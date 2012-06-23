(in-package :wu)

(defvar *access-id*)			;SEOMOZ parameters, initialized from config vars
(defvar *secret*)

;;; Current Unix UTC time
(defun unix-current-time ()
  (- (get-universal-time) 2208988800))

(defun seomoz-query-url (page)
  (let* ((expires (+ (unix-current-time) (* 1 60)))
	 (signature (wu::hmac-sha1-string (format nil "~A~%~A" *access-id* expires) *secret* :bytes)))
    (format nil "http://lsapi.seomoz.com/linkscape/links/~A?SourceCols=5&TargetCols=4&Scope=page_to_page&Sort=page_authority&Filter=External&AccessID=~A&Expires=~A&Signature=~A"
	    (uriencode-string page)
	    *access-id*
	    expires
	    (uriencode-string (cl-base64:usb8-array-to-base64-string signature)))))

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

(defun bytes->string (bytes)
  (coerce (mapcar #'code-char (coerce bytes 'list)) 'string))

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
    (simple-vector (mt:vector->string result))))

(defun seomoz-query (page)
  (mt:plet* ((url (seomoz-query-url page))
	 (json
	  (json:decode-json-from-string (coerce-to-string (drakma:http-request url :basic-authorization (list *access-id* *secret*))))))
	    (when (assocdr :error--message json)
	      (error "Error from server: ~A" json))
    (mapcar #'(lambda (elt) (list (mt:assocdr :uu elt) (mt:assocdr :ut elt))) json)))

;;; Server
(publish :path "/linkback-srv"
	 :function 'linkback-service)

(defun trim-page-url (url)
  (if (mt:string-prefix-equals url "http://")
      (subseq url 7)
      url))

(defun linkback-service (req ent)
  (let* ((page (trim-page-url (request-query-value "page" req)))
	 (results (seomoz-query page)))
    (with-http-response-and-body (req ent :content-type "application/javascript")
      (json:encode-json 
       (mapcar #'(lambda (result)
		   `(("url" . ,(mt:string+ "http://" (car result)))
		     ("title" . ,(if (zerop (length (cadr result)))
				     (car result)
				     (cadr result)))))
	       results)
       *html-stream*))))

;;; HTML service

(publish :path "/linkback.html"
	 :content-type "text/html"
	 :function 'linkback-html-service)

(defun linkback-html-service (req ent)
  (let* ((page (trim-page-url (request-query-value "page" req)))
	 (results (seomoz-query page)))
    (with-http-response-and-body (req ent)
      (html 
       ((:div :style "background-color: #FDE")
	(:ul
	 (dolist (result results)
	   (html
	    (:ul
	     ((:a :href (mt:string+ "http://" (car result)))
	      (:princ-safe (if (zerop (length (cadr result)))
				     (car result)
				     (cadr result)))))))))))))
