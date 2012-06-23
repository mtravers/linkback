(in-package :wu)

(defun subdir (dir down)
  (setq dir (pathname dir))
  (namestring (make-pathname :defaults dir :directory (append (pathname-directory dir) (list down)))))

;;; Called at application initialization time.
(defun cl-user::initialize-application (&key (home "/app/"))
  (setq *access-id* (ccl:getenv "SEOMOZ_ACCESS_ID"))
  (setq *secret* (ccl:getenv "SEOMOZ_SECRET"))
  (wuwei-initialize-application :directory (subdir home "wupub")) ;for some reason ./wupub is failing, try this.
  (publish-website (subdir home "public")))




		   



