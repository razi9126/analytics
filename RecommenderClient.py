from __future__ import print_function

import grpc
import Analytics_Recommender_pb2
import Analytics_Recommender_pb2_grpc

import numpy as np
import pandas as pd

def Rest_User(stub):
	query = Analytics_Recommender_pb2.Query(queryMessage = "GetAll")
	allrecords = {}
	records = stub.GetFollowedRestaurants(query)
	i = 0
	for record in records:
		if i == 0:
			print(record.user_id)
			print(record.restaurant_id)
		allrecords[i] = {'user_id': record.user_id, 'restaurant_id': record.restaurant_id}
		i += 1

	return pd.DataFrame.from_dict(allrecords, orient = 'index')



def run():
    channel = grpc.insecure_channel('localhost:50051')
    stub = Analytics_Recommender_pb2_grpc.AnalyticsStub(channel)
    print("Connection Established")
    RestFollowed_df = Rest_User(stub)
    print(RestFollowed_df.head())

if __name__ == '__main__':
    run()
