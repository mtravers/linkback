(in-package :wu)

;; http://apiwiki.seomoz.org/w/page/13991141/Links%20API

(defvar *access-id* nil)			;SEOMOZ parameters, initialized from config vars
(defvar *secret* nil)

;;; Current Unix UTC time
(defun unix-current-time ()
  (- (get-universal-time) 2208988800))

(defun seomoz-query-url (page &key limit offset)
  (let* ((expires (+ (unix-current-time) (* 1 60)))
	 (signature (wu::hmac-sha1-string (format nil "~A~%~A" *access-id* expires) *secret* :bytes)))
    (format nil "http://lsapi.seomoz.com/linkscape/links/~A?SourceCols=5&TargetCols=4&Scope=page_to_page&Sort=page_authority&Filter=External&AccessID=~A&Expires=~A&Signature=~A~A~A"
	    (uriencode-string page)
	    *access-id*
	    expires
	    (uriencode-string (cl-base64:usb8-array-to-base64-string signature))
	    (if limit (format nil "&Limit=~A" limit) "")
	    (if offset (format nil "&Offset=~A" offset) "")
	    )))

;;; Alternate method (but the above works now, so this is not called)
(defun seomoz-query-url-basic-auth (page)
  (format nil "http://lsapi.seomoz.com/linkscape/links/~A?SourceCols=5&TargetCols=4&Scope=page_to_page&Sort=page_authority&Filter=External"
	  (uriencode-string page)
	  ))

#| this version makes more sense but returns very few links....
(defun seomoz-query-url-basic-auth (page)
  (format nil "http://lsapi.seomoz.com/linkscape/links/~A?SourceCols=5&TargetCols=4&Scope=domain_to_page&Sort=domain_authority&Filter=External"
	  (uriencode-string page)
	  ))
|#

(defun test (page)
  (let ((url (seomoz-query-url page)))
    (print url)
    (coerce (mapcar #'code-char (coerce (drakma:http-request url) 'list)) 'string)))

;;; ah, this works
(defun test-basic-auth (page)
  (let ((url (seomoz-query-url-basic-auth page)))
    (print url)
    (drakma:http-request url :basic-authorization (list *access-id* *secret*))))

;;; successes come out as strings, errors as byte vectors, pkm!
(defun coerce-to-string (result)
  (etypecase result
    (string result)
    (array (mt:vector->string result))))

#| for development when service is down
(defun seomoz-query (page &rest args)
  '(("http://hyperphor.com" "Lorem ipse dixit")
    ("http://hyperphor.com" "Lorem ipse dixit")
    ("http://hyperphor.com" "Lorem ipse dixit")
    ("http://hyperphor.com" "Lorem ipse dixit")
    ("http://hyperphor.com" "Lorem ipse dixit")
    ("http://hyperphor.com" "Lorem ipse dixit")
    ("http://hyperphor.com" "Lorem ipse dixit")
    ("http://hyperphor.com" "Lorem ipse dixit")
    ("http://hyperphor.com" "Lorem ipse dixit")))
|# 

(defvar *seomoz-lock* (acl-compat.mp:make-process-lock :name 'seomoz))

(defun seomoz-query-in-one-thread (page &rest args)
  (acl-compat.mp:with-process-lock (*seomoz-lock*) ;timeout would be good, but not supported
    (apply 'seomoz-query-with-retry page 2 args)))

(defun seomoz-query-with-retry (page count &rest args)
  (if (zerop count)
      (apply 'seomoz-query page args)
      (handler-case (apply 'seomoz-query page args)
	(http-error (c)
	  (if (eq 503 (net.aserve::response-number (slot-value c 'response)))
	      (progn (sleep 11)		;Sleep for 11 seconds (we are only allowed 1 query every 10 secs, and apparently failed ones count!)
		     (apply 'seomoz-query-with-retry page (1- count) args))
	      (error c))))))

(defun seomoz-query (page &rest args)
  (let* ((url (apply #'seomoz-query-url page args))
	 (json
	  (json:decode-json-from-string (coerce-to-string (drakma:http-request url :basic-authorization (list *access-id* *secret*))))))
    (when (assocdr :error--message json)
      (let ((message (format nil "Error from server: ~A" json)))
	(error 'http-error :response (net.aserve::make-resp (parse-integer (assocdr :status json)) message) :message message)))
    (mapcar #'(lambda (elt) (list (mt:assocdr :uu elt) (mt:assocdr :ut elt))) json)))

;;; Server
(publish :path "/linkback-srv"
	 :content-type "application/javascript"
	 :function 'linkback-service)

(defun trim-page-url (url)
  (multiple-value-bind (match? strings)
      (cl-ppcre:scan-to-strings "^\\w+://(.*)" url)
    (if match?
	(svref strings 0)
	url)))

(define-condition http-error (error) 
  ((response :initarg :response :initform *response-internal-server-error*)
   (message :initarg :message :initform nil))
#+ACL  (:default-initargs :format-control  "HTTP error ~A: ~A")
  )

(defmacro with-http-error-handling ((req ent &key handler) &body body)
  `(handler-case (progn ,@body)
      (http-error (c)
	   (with-http-response-and-body (,req ,ent :response (slot-value c 'response) :content-type :text)
	     ,handler))
     (error (c)
       (with-http-response-and-body (,req ,ent 
					 :response *response-internal-server-error*
					 :content-type :text)
	 ,handler))))

;;;; +++ poss for wuwei
(defmacro with-json-error-handling ((req ent) &body body)
  `(with-http-error-handling (,req ,ent :handler 
				   (json:encode-json `((:|error| . ,(princ-to-string c)))
						     *html-stream*))
     ,@body))

(defun linkback-service (req ent)
  (with-json-error-handling (req ent)
    (let* ((page (trim-page-url (request-query-value "page" req)))
	   (results (seomoz-query-in-one-thread page :limit 20)))
      (with-http-response-and-body (req ent)
	(json:encode-json
	 (mapcar #'(lambda (result)
		     `(("url" . ,(mt:string+ "http://" (car result)))
		       ("title" . ,(if (zerop (length (cadr result)))
				       (car result)
				       (cadr result)))))
		 results)
	 *html-stream*)))))

;;; HTML service

(publish :path "/linkback.html"
	 :content-type "text/html"
	 :function 'linkback-html-service)

;;; Argh, very temp I hope
(defun de-unicode-string (s)
  (dotimes (i (length s) s)
    (when (> (char-code (char s i)) 255)
      (setf (char s i) #\-))))

(defparameter *page-size* 40)

(defun linkback-html-service (req ent)
  (let* (;; page is URL, not page #
	 (page (trim-page-url (request-query-value "page" req)))
	 (offset (ignore-errors (parse-integer (request-query-value "offset" req))))
	 ;; zero-based page #
	 (pagen (or (and offset (/ offset *page-size*)) 0))
	 (results (seomoz-query-in-one-thread page :limit *page-size* :offset offset)))
    (with-http-response (req ent)
      (with-http-body (req ent)
	(html
	 (:head
	  ((:link :type "text/css" :rel "stylesheet" :href "style.css")))
	 (:body
	  (:h2 "Links to "
	       (link-to page page))
	  (if results
	      (progn
		(when offset (html 
			     (:h3 (:princ (format nil "Page ~A" (1+ pagen))))))
		(html
		 ((:ul :class "morelinks")
		  (dolist (result results)
		    (html
		     (:li
		      ((:a :href (mt:string+ "http://" (car result)))
		       (:princ (if (zerop (length (cadr result)))
				   (car result)
				   (de-unicode-string (cadr result))))))))))
		(flet ((pageurl (pagen)
			 (format nil "/linkback.html?~A"
				 (query-to-form-urlencoded
				  `(("page" . ,page)
				    ("offset" . ,(* *page-size* pagen))))))) ; (+ (or offset 0) *page-size*)))))
		  (when offset
		    (link-to (format nil "&larr; Page ~A" (1+ (1- pagen))) 
			     (pageurl (1- pagen))))
		  (when (or offset  (= (length results) *page-size*))
		    (html "&emsp;&bull;&emsp;"))
		  (when (= (length results) *page-size*)
		    (link-to (format nil "Page ~A &rarr;" (1+ (1+ pagen)))
			     (pageurl (1+ pagen))))))
	      (html "No more results"))
	  (html
	   ((:div :style "top-margin: 5px;")
	    "Brought to you by " 
	    ((:a :href "/") "LinkBack") :br
	    "Data kindly provided by " 
	    ((:a :href "http://seomoz.org/")
	     "seomoz.org"
	     ((:img :src "linkscape.png")))))
	  ))))))

