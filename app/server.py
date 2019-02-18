import os
import unittest

from app import create_app

(app, mongo) = create_app(os.getenv('FLASK_ENV') or 'dev')


@app.cli.command('run')
def run():
    app.run(host='0.0.0.0')


if __name__ == '__main__':
    app.run(host='0.0.0.0')
