import os

basedir = os.path.abspath(os.path.dirname(__file__))


class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'my_secret_key')
    DEBUG = False
    TESTING = False

    # MongoDB config
    MONGO_URI = "mongodb://localhost:27017/uwcourse"

    DATABASE_URI = MONGO_URI


class DevelopmentConfig(Config):
    ENV = 'development'
    DEBUG = True


class TestingConfig(Config):
    ENV = 'testing'
    DEBUG = True
    TESTING = True


class ProductionConfig(Config):
    ENV = 'production'
    DEBUG = False


config_by_name = dict(
    dev=DevelopmentConfig,
    test=TestingConfig,
    prod=ProductionConfig
)

key = Config.SECRET_KEY
