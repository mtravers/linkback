(in-package :wu)

(defun publish-website ()
  (publish-directory :destination "/app/public/"
		     :prefix "/"))


;;; Want to put in a check for Chrome, but that requires either a templating engine or pulling the static page into code...
