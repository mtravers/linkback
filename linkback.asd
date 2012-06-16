(in-package :asdf)

(defsystem :linkback
    :name "LinkBack"
    :author "Mike Travers"
    :description "Support for LinkBack web widget"
    :depends-on (:aserve :wuwei :cl-json)
    :components
    ((:static-file "linkback.asd")
     (:module :src
	      :serial t      
	      :components
	      ((:file "server")
	       (:file "website")
	       (:file "heroku"))
	      )))

