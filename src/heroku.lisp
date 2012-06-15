(in-package :net.aserve)

;;; Called at application initialization time.
(defun cl-user::initialize-application ()
  (setq *access-id* (ccl:getenv "SEOMOZ_ACCESS_ID"))
  (setq *secret* (ccl:getenv "SEOMOZ_SECRET"))
  (wu:wuwei-initialize-application :directory "/app/wupub/")) ;for some reason ./wupub is failing, try this.





		   



