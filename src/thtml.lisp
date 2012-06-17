(in-package :wu)

;;; HTML templating (based on shtml)

#|
<!--#include -->
<!--#if expr="test_condition" -->
<!--#elif expr="test_condition" -->  (not implemented)
<!--#else -->
<!--#endif -->

Caveats:
- nesting #lisp in #if works, nesting #if s does not.
- line endings are not always conserved exactly.

|#
;;; This can be passed to the :filter arg of publish-directory.

(defun thtml-filter (req ent filename info)
  (declare (ignore info))
  (with-http-response (req ent)
    (if (search ".thtml" filename)
	(with-session (req ent)
	  (with-session-response (req ent :content-type "text/html")	
	    (output-thtml *html-stream* filename))
	  t)
	nil)))

(defvar *debug-thtml?* nil)

(defun output-thtml (stream file)
  (when *debug-thtml?*
    (format stream "~%<!-- {begin ~A} -->" file))
  (with-open-file (istream file :direction :input)
    (translate-ssi istream stream file))
  (when *debug-thtml?*
    (format stream "~%<!-- {end ~A} -->" file)))

 (defun translate-ssi (istream stream &optional file)
  (let ((in-conditional? nil)	;flags for #if
	(output? t))		
    (labels ((maybe-write (string &optional eol)
	       (when output?
		 (write-string string stream)
		 (when eol (write-char #\Newline stream))))
	     (process-line (line)
	       (multiple-value-bind (match? substrings)
		   (cl-ppcre:scan-to-strings "(.*)<!--\\s*#(\\w+)(.*)-->(.*)" line)
		 (if match?
		     (let ((pre (aref substrings 0))
			   (cmd (aref substrings 1))
			   (rest (aref substrings 2))
			   (post (aref substrings 3)))
		       (let ((args (collecting
				    (cl-ppcre::do-register-groups (param val)
				      ("(\\w+?)=\"(.*?)\"" rest)
				      (collect (list param val))))))
			 (maybe-write pre)
			 (cond ((equal cmd "include")
				(when output?
				  (let* ((fname (assocadr "virtual" args :test #'string-equal))
					 (included-file (merge-pathnames fname file)))
				    (output-thtml stream included-file))))
			       ((equal cmd "lisp")
				;; +++ might also want to be able to supply a function that gets passed the stream
				(when output?
				  (handler-case 
				      (let* ((form (assocadr "expr" args :test #'string-equal))
					     (val (eval (read-from-string form))))
					(princ val stream))
				    (error (e)
				      (html-to-stream stream
						      (:b (:princ-safe (format nil "error processing ~a: ~a" line e))))
				      ))))
			       ((equal cmd "if")
				(let* ((form (assocadr "expr" args :test #'string-equal))
				       (val (eval (read-from-string form))))
				  (setf in-conditional? t)
				  (setf output? val)))
			       ((equal cmd "else")
				(unless in-conditional?
				  (error "#else outside of #if"))
				(setf output? (not output?)))
			       ((equal cmd "endif")
				(unless in-conditional?
				  (error "#endif outside of #if"))
				(setf output? t in-conditional? nil))
			       (t (error "Unknown ssi cmd ~A" cmd))
			       )
			 (process-line post)))
		     ;; reg line
		     (maybe-write line t)))      
	       ))
      (loop for line = (read-line istream nil nil)
	 while line
	 do (process-line line)))))

#|
(ql:quickload :fiveam)

(5am:test lisp-ssi ()
	  (let ((trans
		 (with-output-to-string (out)
		   (with-input-from-string (in "My favorite number is <!-- #lisp expr=\"(expt 23 2)\" -->, what's yours?
")
		     (translate-ssi in out)))))
	    (print trans)
	    (5am:is (equal trans "My favorite number is 529, what's yours?
"))))

|#


