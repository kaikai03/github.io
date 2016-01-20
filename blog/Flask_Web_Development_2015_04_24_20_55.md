Title: Flask Web Development(6)
Date: 2015-04-24 20:55
Modified: 2015-04-24 20:55
Category: pyDev
Tags: Flask,Python,Web
Slug: Flask_Web_Development_2015_04_24_20_55
Authors: tangyefei
Summary: 第6章 邮件

## 《Flask Web Development》--第6章 邮件 ##
 
当某些事件被触发，应用程序通常需要通过邮件方式通知用户。Python的原生包smtplib能够被用于发送邮件，但是Flask的扩展Flask-Mail更好包装了smtplib能够方便地和Flask进行交互。

### Flask-Mail提供的邮件支持 ###

安装

	(venv) $ pip install flask-mail

配置server等参数

	app.config['MAIL_SERVER'] = 'smtp.googlemail.com'
	app.config['MAIL_PORT'] = 587
	app.config['MAIL_USE_TLS'] = True
	app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
	app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')

配置所用到的用户名和密码

	(venv) $ export MAIL_USERNAME=<Gmail username>
	(venv) $ export MAIL_PASSWORD=<Gmail password>

通过Python Shell发送邮件 mSending Email from the Python Shell

为了测试上述配置是否有用，可以在shell中测试是否有用：

	(venv) $ python hello.py shell
	>>> from flask.ext.mail import Message
	>>> from index import mail
	>>> msg = Message('test subject', sender='you@example.com', 
	... recipients=['you@example.com'])
	>>> msg.body = 'text body'
	>>> msg.html = '<b>HTML</b> body'
	>>> with app.app_context():
	... mail.send(msg)
	...

### 邮件和应用程序集成 ### 

配置和定义send_mail：

	app.config['FLASKY_MAIL_SUBJECT_PREFIX'] = '[Flasky]'
	app.config['FLASKY_MAIL_SENDER'] = 'Flasky Admin flasky@example.com'
	
	def send_email(to, subject, template, **kwargs):
	    msg = Message(app.config['FLASKY_MAIL_SUBJECT_PREFIX'] + subject,
	                  sender=app.config['FLASKY_MAIL_SENDER'], recipients=[to])
	    msg.body = render_template(template + '.txt', **kwargs)
	    msg.html = render_template(template + '.html', **kwargs)
	    mail.send(msg)

相应地改写view Function：

	app.config['FLASKY_ADMIN'] = os.environ.get('FLASKY_ADMIN')
	#...
	@app.route('/', methods=['GET', 'POST'])
	def index():
	    form = NameForm()
	    if form.validate_on_submit():
	        user = User.query.filter_by(username=form.name.data).first()
	        if user is None:
	            user = User(username=form.name.data)
	            db.session.add(user)
	            session['known'] = False
	            if app.config['FLASKY_ADMIN']:
	                send_email(app.config['FLASKY_ADMIN'], 'New User',
	                           'mail/new_user', user=user)
	        else:
	            session['known'] = True
	
	        session['name'] = form.name.data
	        form.name.data = ''
	
	        return redirect(url_for('index'))
	    return render_template('index.html', form=form, name=session.get('name'), known=session.get('known', False))

配置系统环境变量：

	(venv) $ export FLASKY_ADMIN=<your-email-address>

### 发送异步邮件 ### 

发送邮件的瞬间，页面是没有响应的，为了jiejeu这个问题，邮件发送可以交给后台线程来做：

	from threading import Thread
	
	def send_async_email(app, msg):
	    with app.app_context():
	        mail.send(msg)
	
	def send_email(to, subject, template, **kwargs):
	    msg = Message(app.config['FLASKY_MAIL_SUBJECT_PREFIX'] + subject,
	                  sender=app.config['FLASKY_MAIL_SENDER'], recipients=[to])
	    msg.body = render_template(template + '.txt', **kwargs)
	    msg.html = render_template(template + '.html', **kwargs)
	    thr = Thread(target=send_async_email, args=[app, msg])
	    thr.start()
	    return thr

