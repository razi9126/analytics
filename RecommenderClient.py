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
		allrecords[i] = {'user_id': record.user_id, 'restaurant_id': record.restaurant_id}
		i += 1

	return pd.DataFrame.from_dict(allrecords, orient = 'index')

def getReviews(stub):
	query = Analytics_Recommender_pb2.Query(queryMessage = "GetAll")
	allrecords = {}
	records = stub.GetUploadedReviews(query)
	i = 0
	for record in records:
		allrecords[i] = {
			'uploader_id': record.uploader_id,
			'review_id': record.review_id,
			'restaurant_id': record.restaurant_id,
			'service': record.service,
			'ambience': record.ambience,
			'cleanliness': record.cleanliness,
			'dish_name': record.dish_name,
			'value_for_money': record.value_for_money,
			'taste': record.taste
		}
		i += 1

	return pd.DataFrame.from_dict(allrecords, orient = 'index')




def run():
    channel = grpc.insecure_channel('localhost:50051')
    stub = Analytics_Recommender_pb2_grpc.AnalyticsStub(channel)
    print("Stub Created")
    # RestFollowed_df = Rest_User(stub)
    # print(RestFollowed_df.head())
    allReviews_df = getReviews(stub)
    print(allReviews_df.tail())
    print(allReviews_df.shape)

if __name__ == '__main__':
	run()