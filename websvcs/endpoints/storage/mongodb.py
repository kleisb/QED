from tornado.options import options, logging, define
import tornado.web
import os
import json
import uuid
import glob

from pymongo import Connection

define("mongo_host", default="localhost", help="Hostname for MongoDB")
define("mongo_port", default=27017, help="Port for MongoDB", type=int)

conn = Connection(host=options.mongo_host, port=options.mongo_port, document_class=dict)

class MongoStorageHandler(tornado.web.RequestHandler):

    def get(self, identity):
        logging.info("MongoStorageHandler.get:%s" % self.request.uri)

        ids = identity.split("/")
        if len(ids) == 1:
            json_items = []
            for item in glob.glob("STORAGE/%s/*.dat" % ids[0]):
                item_id = item.replace("STORAGE/%s/" % ids[0], "").replace(".dat", "")
                json_items.append({
                    "id": item_id,
                    "uri": self.request.uri + "/" + item_id
                })
            self.write({ "items": json_items })
            self.set_status(200)
            return
        elif len(ids) == 2:
            file_path = "STORAGE/%s/%s.dat" % (ids[0],ids[1])
            if os.path.exists(file_path):
                json_data=open(file_path).read()
                self.write(json.loads(json_data))
                self.set_status(200)
                return
            else:
                self.set_status(404)
                return

        self.set_status(404)

    def post(self, identity):
        logging.info("MongoStorageHandler.post:%s" % self.request.uri)

        ids = identity.split("/")

        item_id = None
        if len(ids) == 1: item_id = uuid.uuid4()
        elif len(ids) == 2: item_id = ids[1]
        else: return

        if not os.path.exists("STORAGE"): os.makedirs("STORAGE")
        if not os.path.exists("STORAGE/" + ids[0]): os.makedirs("STORAGE/" + ids[0])

        f = open('STORAGE/%s/%s.dat' % (ids[0], item_id), 'w+')
        f.write(json.dumps(self.request.arguments))

        self.write({ "id": str(item_id) })
        self.set_status(200)


