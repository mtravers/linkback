;;; Not loaded, here for no good reason.

#| What this is: regular linkback showed me a surprising link from an old friends blog to a wikipedia 
page on some buddhist concept.  I was mad to find out what this said, but couldn't find it by the ordinary means. |#

(ql:quickload :cl-html-parse)

(defun grab-whole-blogger-blog (start-url out)
  (print `(grabbing ,start-url))
  (let* ((contents (net.aserve.client:do-http-request start-url))
	 (parse (html-parse:parse-html contents))
	 (next (html-find-by-id parse  "blog-pager-older-link"))
	 (nexturl (findprop :href (car (cadr next)))))
    (write-string contents out)
    (when next
      (grab-whole-blogger-blog nexturl out))))


(defun html-find-by-id (parsed-html id)
  (mt::dotree-all #'(lambda (item)
		  (when (and (listp item)
			     (listp (car item))
			     (equal (findprop :id (car item)) id))
		    (return-from html-find-by-id item)))
	      parsed-html)
  nil)

    
(with-open-file (s "/tmp/mmcm" :direction :output :if-exists :supersede)
  (grab-whole-blogger-blog "http://polyglotveg.blogspot.com/2011/11/green-bean.html" s))
