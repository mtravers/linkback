(in-package :wu)

(defvar *linkback-public-directory*)

(defun publish-website (&optional (from "/app/public/"))
  (setq *linkback-public-directory* from)
  (publish-directory :destination from
		     :prefix "/"))

;;; Want to put in a check for Chrome, but that requires either a templating engine or pulling the static page into code...

(publish :path "/"
	 :content-type "text/html"
	 :function 'dyndex)

(publish :path "/index.html"
	 :content-type "text/html"
	 :function 'dyndex)

(defun dyndex (req ent)
  (let ((*chrome?* (cl-ppcre:scan "Chrome/" (header-slot-value req :user-agent))))
    (declare (special *chrome?*))
    (with-http-response-and-body (req ent)
      (output-thtml *html-stream* (merge-pathnames "index.thtml" *linkback-public-directory*)))))
