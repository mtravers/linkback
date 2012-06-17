(in-package :wu)

(defun publish-website ()
  (publish-directory :destination "/app/public/"
		     :prefix "/"))


;;; Want to put in a check for Chrome, but that requires either a templating engine or pulling the static page into code...

(publish :path "/dyndex.html"
	 :content-type "text/html"
	 :function 'dyndex)

(defun dyndes (req ent)
  (with-http-response-and-body (req ent)
    (html
     (:head
      (:title "LinkBack: bidirectional linking on the cheap")
      (css-includes "wuwei.css"))
     (:body
      (:h3  "LinkBack: bidirectional linking on the cheap")
      (:table
       (:tr
	(:td
	 (:p
	  (:princ
	   "LinkBack is a browser extension that will automatically display incoming links for any web page you visit."))
	 (:p
	  (if chrome?
	      (install-button)
	      (html
	       ((:div :style "border:2px red solid;margin:10px;padding:5px;width:500px;")
		(:B "Sorry!" )
		"For now, Linkback only works on Chrome"))))

	 )
	(:td
	 ((:img :src "big-in-japan.png")))))
      
      (:h3 "The Bidirectional Web")
      (:p "Ted Nelson coined the term Hypertext over 30 years ago, and articulated its principles, most of which have been ignored in the triumph of the Web.  This is merely one instance of the general "
	  ((:a :href "http://www.dreamsongs.com/WorseIsBetter.html") "\"worse is better\" principle")
	  ", which essentially says that doing the wrong thing in a way that lowers adoption barriers will beat doing the right thing every time.  (See the triumph of C over Lisp for an example dearer to my heart).")
      
      (:p "The corollary of this principle is that all the people who charged off in the worse direction will eventually realize the problems with their approach and start integrating elements of the better idea into their sunk investments in doing things the wrong way.  Thus, Java started off as an attempt to graft Lisp-style memory management onto a C syntax language, and now they are beginning to discover the joys of scripting and dynamic typing.")
      (:p "One of the principle elements of Nelson's vision that was left out of the web is the "
	  ((:a :href "http://xanadu.com/xuTheModel/")
	   "inherent bidirectionality of hyperlinks")
	  ".  This just means that a link from A to B should be visible and traversable from B to A as well.	 A simple idea, but suprisingly difficult to implement if you start with the sort of document-centric model that the web uses.")
      (:p "Another related principle of Nelsonian Hypertext is that links were inherently annotations on a document rather than inherent parts of the documents, and that the whole point of them was to allow a third party to comment on somebody else's text.  This property is entirely absent from the web, and difficult to implement.")
      (:h3 




      
      


		  (tracker)

		  )))
