import os

basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'you-will-never-guess'
        if os.environ.get('DATABASE_URL'):
            # Heroku PostgreSQL URL fix for SQLAlchemy
            uri = os.environ.get('DATABASE_URL')
            if uri.startswith('postgres://'):
                uri = uri.replace('postgres://', 'postgresql://', 1)
            SQLALCHEMY_DATABASE_URI = uri
        else:
            SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'app.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
