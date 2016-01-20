Title: Flask Web Development(7)
Date: 2015-04-25 00:26
Modified: 2015-04-25 00:26
Category: pyDev
Tags: Flask,Python,Web
Slug: Flask_Web_Development_2015_04_25_00_26
Authors: tangyefei
Summary: 第7章 大型应用程序架构

##《Flask Web Development》--第7章 大型应用程序架构 ##


把一个小应用程序的代码都放在一起会很方便，但是不利于扩展，尤其当项目开始变大时在一个文件中工作就会带来一些问题。不像其他框架，Flask应用程序没有特定的组织方式，选择权完全交给了使用者。本章会介绍一种按照包和模块来组织大型应用程序的方法，并会在本书剩余的章节都采用这种结构。

### 项目结构 ###

一个Flask应用程序的布局：

	|-flashy
	  |-app/
	    |-templates/
		|-static/
		|-main/
		  |-__init__.py
		  |-errors.py
		  |-forms.py
		  |-views.py
		|-__init__.py
		|-email.py
		|-models.py
	  |-migrations/
	  |-tests/
		|-__init__.py
		|-test*.py
	  |-venv.
	  |-requirements.txt


顶级有四个文件夹，分别是：

- Flask应用程序所在的包通常被命名为app
- 数据库迁移相关的脚本被放置在migration
- 单元测试写在在tests
- venv包含了Python的虚拟环境

同样，增加了一些新的文件：

- requirements.txt 列举了依赖的包方便在新的电脑中对虚拟环境快速进行配置
- config.py 存储了应用程序的配置参数
- manage.py 用于启动应用程序以及做一些其他任务

为了更好地理解这样的布局方式，后面的部分会介绍如何从一个只有hello.py的程序扩展到上图所示的结构。

### 配置选项 ###

应用程序需要一些配置，比如对于开发、测试、产品会需要不同的数据库那样才不会相互影响。和单文件版本中在*hello.py*中写所有的配置不同，我们能够用类层级的方式来组织配置：

*config.py*: 
Application configuration

	import os
	basedir = os.path.abspath(os.path.dirname(__file__))
	
	class Config:
	    SECRET_KEY = os.environ.get('SECRET_KEY') or 'hard to guess string' 
	    SQLALCHEMY_COMMIT_ON_TEARDOWN = True
	    FLASKY_MAIL_SUBJECT_PREFIX = '[Flasky]'
	    FLASKY_MAIL_SENDER = 'Flasky Admin <flasky@example.com>' 
	    FLASKY_ADMIN = os.environ.get('FLASKY_ADMIN')
	
	    @staticmethod
	    def init_app(app): 
	        pass
	
	class DevelopmentConfig(Config): DEBUG = True
	    MAIL_SERVER = 'smtp.googlemail.com'
	    MAIL_PORT = 587
	    MAIL_USE_TLS = True
	    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
	    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD') 
	    SQLALCHEMY_DATABASE_URI = os.environ.get('DEV_DATABASE_URL') or \
	        'sqlite:///' + os.path.join(basedir, 'data-dev.sqlite')
	
	class TestingConfig(Config): 
	    TESTING = True
	    SQLALCHEMY_DATABASE_URI = os.environ.get('TEST_DATABASE_URL') or \ 'sqlite:///' + os.path.join(basedir, 'data-test.sqlite')
	
	class ProductionConfig(Config):
	    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
	        'sqlite:///' + os.path.join(basedir, 'data.sqlite')
	
	config = {
	    'development': DevelopmentConfig,
	    'testing': TestingConfig,
	    'production': ProductionConfig,
	    'default': DevelopmentConfig
	}

Config基类包含了对所有配置通用的设置，不同的配置子类则定义了特有的设置。随需求变更还能增加其他配置子类。

为了让配置更灵活、安全，一些配置参数可以从环境变量中导入，比如SECRET_KEY考虑到安全性，可以存储在环境变量中，并且在配置脚本中提供了一个默认值以防环境变量没有设置它。

在三套不同的配置中，SQLALCHEMY_DATABASE_URI被赋予了不同的值，这样运行在三套不同配置下的应用程序都使用了不同的数据库。

配置类定义了类方法`init_app()`，它接受一个应用程序实例作为参数。这样特殊的配置就能够执行了（`注：原文是 Here configuration-specific initialization can performed 没明白init_app()这个方法跟特殊配置起不起作用有什么关系，至少在本章中的例子中没有体现出来`）。当前，仅Config类实现了一个空的`init_app()`方法。

在配置文件的底部不同的配置被添加到了字典中，并且开发环境的配置被设置成了默认的。

### 应用程序包App ###

应用程序包app是所有应用程序代码、模板、静态资源文件存放的地方，当然你也可以根据项目需求取别的名字。模板和资源文件的文件夹都被放入了app中，数据库对应的models和邮件支持功能模块则分别对应* app/models.py* 和 *app/email.py*。

### 使用工厂方法来构建应用示例 ###

在单文件版本中创建应用程序实例很方便，但是通常会有缺陷。因为应用程序实例在全局作用于下被创建，而实例被创建后是没办法动态修改配置的。 尤其在做单元测试时，因为要跑不同的数据库，所以我们要应用不同的配置。

解决办法就是通过使用工厂方法延迟应用程序实例的创建，这样不仅仅是延迟了创建时间还让脚本有创建多个应用程序实例的能力，这对于测试尤其有用。

app包导入了Flask目前会用到的扩展，但因为应用程序实例还没有被构建出来，它们都还没有被正确初始化。`create_app()`这个工厂方法接受一个配置名称作为参数，通过使用Flask提供的app.config的`from_object()`方法，我们就能从*config.py*中导入所需要的配置。一旦应用程序实例被创建出来，扩展就能够通过调用`init_app()`来完成初始化。

*app/__init__.py*: 
Application package constructor

	from flask import Flask, render_template 
	from flask.ext.bootstrap import Bootstrap 
	from flask.ext.mail import Mail
	from flask.ext.moment import Moment
	from flask.ext.sqlalchemy import SQLAlchemy 
	from config import config
	
	bootstrap = Bootstrap()
	mail = Mail()
	moment = Moment()
	db = SQLAlchemy()
	
	def create_app(config_name):
	    app = Flask(__name__) 
	    app.config.from_object(config[config_name]) 
	    config[config_name].init_app(app)
	    bootstrap.init_app(app)
	    mail.init_app(app)
	    moment.init_app(app)
	    db.init_app(app)
	    # attach routes and custom error pages here
	
	    return app

工厂方法返回的应用程序实例还不完整，因它们没有包含路由和错误处理功能，下一节会介绍如何解决这个问题。

### 使用Blueprint来实现应用程实例的功能 ###

用工厂方法构建应用程序实例会给路由设置带来一些麻烦。单脚本应用中，应用程序实例是全局的，路由能简单地用app.route decorator来定义。但是现在应用程序实例是运行时创建的，app.route decorator只在在create_app()以后才存在，除此之外app.errorhandler decorator也有同样的问题。

Flask提供的解决方案是使用blueprints来解决这个问题。blueprints跟application类似，也能定义路由。不同之处是它的路由都处于休眠状态，直到它被注册到应用程序实例后路由才是它的一部分。

blueprint在全局作用域下使用，因此我们完全可以像在单文件中那样使用路由。当然你既能通过单文件也能通过更加组织良好的方式。为了达到最大程度的便利性，一个子包结构被创建用于管理blueprint。Example 7-4展示了在这个main包中如何创建blueprint：

*app/main/init.py*: 
Blueprint creation

	from flask import Blueprint
	main = Blueprint('main', __name__) 
	from . import views, errors

blueprints被创建为Blueprint的实例对象，构造函数有两个参数：blueprint的名字和它所在的模块或者包，在这个应用程序中，Python的 \_\_name\_\_ 变量就是第二个参数所需要的值。

应用程序的路由被存储在app/main/views.py模块中， 错误处理则在app/main/errors.py。导入这些模块以后，路由和错误处理就和blueprint关联起来了。

有一点要注意路由和错误处理模块是在app/\_\_init\_\_.py的底部被导入的，因为*views.py *和 *errors.py*要导入main blueprint，所以为了避免循环依赖我们要等到main被创建出来才能够导入路由和错误处理。

blueprint在`create_app()`方法内被注册到应用程序实例中：

*app/__init__.py*: 
Blueprint registration

	def create_app(config_name): 
	    # ...
	    from main 
	    import main as main_blueprint      
	    app.register_blueprint(main_blueprint)
	    return app

### 错误处理 ###

*app/main/errors.py*: 
Blueprint with error handlers

	from flask import render_template 
	from . import main
	
	@main.app_errorhandler(404) 
	def page_not_found(e):
	    return render_template('404.html'), 404
	
	@main.app_errorhandler(500) 
	def internal_server_error(e):
	    return render_template('500.html'), 500

在blueprint使用错误处理，如果使用`@app.errorhandler`，只有由blueprint定义的路由中导致的错误才会触发对应的handler，如果想要错误处理对整个应用程序可用，我们需要使用`@main.app_errorhandler`。

### 使用blueprint方式的路由 ###

*app/main/views.py*: 
Blueprint with application routes

	from datetime import datetime
	from flask import render_template, session, redirect, url_for
	from . import main
	from .forms import NameForm 
	from .. import db
	from ..models import User
	
	@main.route('/', methods=['GET', 'POST']) 
	def index():
	    form = NameForm()
	    if form.validate_on_submit():
	        # ...
	        return redirect(url_for('.index')) 
	    return render_template('index.html',
	                           form=form, name=session.get('name'),
	                           known=session.get('known', False),
	                           current_time=datetime.utcnow())

在blueprint中使用视图方法跟之前有两个不同的地方。第一个是route是来自blueprint，即-使用`@main.route`，第二个是`url_for()`方法的使用。在前面介绍过`url_for()`的参数默认是视图方法的名称，比如在单脚本应用中`index()`这个视图方法的URL能够通过`url_for('index')`获取到。

在blueprints中区别在于所有的作用域都来自于blueprint（作用域就是blueprint的名称，即Blueprint构造函数的第一个参数），因此`index()`视图方法需要通过`main.index`来获取到URL，即`url_for('main.index')`。`url_for()`方法同样支持参数的更短形式，通过将blueprint名字省略，我们可以简写为`url_for('.index')`。当然如果跨越不同的blueprints，blueprint的名字还是要加上的。

为了完成应用程序，我们还需要在*app/main/forms.py*模块导入form相关的一些对象。

### 启动脚本 ###

在顶层文件夹下的*manage.py*是用来启动application的：

*manage.py*: 
Launch script

	#!/usr/bin/env python
	import os
	from app import create_app, db
	from app.models import User, Role
	from flask.ext.script import Manager, Shell
	from flask.ext.migrate import Migrate, MigrateCommand
	
	app = create_app(os.getenv('FLASK_CONFIG') or 'default') 
	manager = Manager(app)
	migrate = Migrate(app, db)
	
	def make_shell_context():
	    return dict(app=app, db=db, User=User, Role=Role)
	
	manager.add_command("shell", Shell(make_context=make_shell_context))
	manager.add_command('db', MigrateCommand)
	
	if __name__ == '__main__': 
	    manager.run()

该脚本首先创建应用程序实例，然后从系统环境中读取`FLASK_CONFIG`变量，如果该变量没有定义则使用默认值。然后`Flask-Script`, `Flask-Migrate`等扩展的实例都被初始化。为了方便在Unix-based系统下运行我们增加了第一行。

### Requirements文件 ###

Applications应该包含一个*requirements.txt*，它记录了有着准确版本号的所有包依赖，这对以在其他电脑上初始化项目环境很重要。通过如下命令能够自动生成一个项目用到的包的*requirement.txt*文件：

	(venv) $ pip freeze >requirements.txt

在一个新的环境中，你如果要复制虚拟环境中的安装包，只需要执行如下命令即可：

	(venv) $ pip install -r requirements.txt

该书示例中的requirement.txt中的包可能有一些已经过时了，你可以选择更加新版的包。如果因此遇到了什么问题，只要回退到老版本即可，因为老版本的都是通过了测试和应用程序兼容的。

### 单元测试 ###

到目前应用程序还很小，几乎还没有什么要测试的，我们先来写一个小的测试例子：

*tests/test_basics.py*: 
Unit tests

	import unittest
	from flask import current_app 
	from app import create_app, db
	
	class BasicsTestCase(unittest.TestCase): 
	
	    def setUp(self):
	        self.app = create_app('testing')
	        self.app_context = self.app.app_context()
	        self.app_context.push()
	        db.create_all()
	
	    def tearDown(self): 
	        db.session.remove() 
	        db.drop_all() 
	        self.app_context.pop()
	
	    def test_app_exists(self): 
	        self.assertFalse(current_app is None)
	
	    def test_app_is_testing(self): 
	        self.assertTrue(current_app.config['TESTING'])

测试是按照Python包中的典型的单元测试的写法来构建的，`setUp()` 和 `tearDown()` 方法在每个测试方法执行前后都会运行，任何以`test_` 开头的方法都会被当做测试方法来执行。关于使用Python包来做单元测试的更多信息可以查看official documentation。

`setUp()`方法创建了测试所需的环境， 他首先创建了应用程序实例用作测试的山下文环境，这样就能确保测试拿到current_app, 然后新建了一个全新的数据库。数据库和应用程序实例最后都会在`tearDown()` 方法被销毁。

第一个测试确保了应用程序实例是存在的，第二个测试应用程序实例在测试配置下运行。为了确保测试文件夹有正确的包结构，我们需要添加一个*tests/__init__.py*文件（注：涉及Python包相关知识），这样单元测试包就能扫描所有在测试文件夹中的模块了。

你可以把代码checkout到7a的历史节点，并且执行 pip install -r requirements.txt 来确保你安装了所需要的包。为了运行测试用例，还需要添加命令到manage.py中：

*manage.py*: 
Unit test launcher command

	@manager.command
	def test():
	    """Run the unit tests."""
	    import unittest
	    tests = unittest.TestLoader().discover('tests') 
	    unittest.TextTestRunner(verbosity=2).run(tests)

`manager.command decorator`所对应的方法名字就是命令的名字，并且方法的文档信息会被显示在help中，`test()` 的实现调用了unittest package包的`test runner`。如下是运行过程：

	(venv) $ python manage.py test
	test_app_exists (test_basics.BasicsTestCase) ... ok
	test_app_is_testing (test_basics.BasicsTestCase) ... ok
	.----------------------------------------------------------------------
	Ran 2 tests in 0.001s
	OK

### 数据库设置 ###

重构后的应用程序使用了跟单文件本版本中完全不同的数据库。数据库URL会首先从环境变量中获取，然后把默认的SQLite数据库作为备选，在三个配置环境下数据库的名字是不同的。

不论数据库的URL是什么，只要是转换到一个新的数据库数，据库表一定要被重新创建（`注：原文Regardless of the source of the database URL, the database tables must be created for the new database 不完全理解`）。使用Flask-Migrate进行迁移管理的过程中，数据库表能够通过如下命令被新建或者upgrade：

	(venv) $ python manage.py db upgrade

第一部分的内容到此算是结束了，我们已经基本介绍了使用Flask来创建应用程序的所有知识，但是你也许仍旧不确定如何将他们捏合在一起。第二部分的目标就是帮助你完成一个应用程序的开发。
