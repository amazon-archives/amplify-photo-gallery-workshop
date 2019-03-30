+++
title = "Connecting the photos bucket to the processor function"
chapter = false
weight = 20
+++

### Triggering the function when new photos are uploaded to the S3 bucket
Now that we've created our Photo Processor function, we need to set up a trigger for it to run. Since we want to process every photo that gets uploaded to an album, we'll make these changes by updating the configuration of the S3 userfiles bucket that Amplify created for us.

1. **Replace photo-albums/amplify/backend/storage/photoalbumsstorage/s3-cloudformation-template.json** with the following:
<div style="height: 550px; overflow-y: scroll;">
{{< highlight json "hl_lines=26-28 90-99 152-175 178-195">}}
{
	"AWSTemplateFormatVersion": "2010-09-09",
	"Description": "S3 resource stack creation using Amplify CLI",
	"Parameters": {
		"bucketName": {
			"Type": "String"
		},
		"authPolicyName": {
			"Type": "String"
		},
		"unauthPolicyName": {
			"Type": "String"
		},
		"authRoleName": {
			"Type": "String"
		},
		"unauthRoleName": {
			"Type": "String"
		},
		"unauthPermissions": {
			"Type": "String"
		},
		"authPermissions": {
			"Type": "String"
		},
		"env": {
            "Type": "String"
        }

	},
	"Conditions": {
		"ShouldNotCreateEnvResources": {
            "Fn::Equals": [
                {
                    "Ref": "env"
                },
                "NONE"
            ]
        },
		"EnableUnauthReadWrite": {
			"Fn::Equals": [
				{
					"Ref": "unauthPermissions"
				},
				"rw"
			]
		},
		"EnableUnauthRead": {
			"Fn::Equals": [
				{
					"Ref": "unauthPermissions"
				},
				"r"
			]
		},
		"EnableUnauthWrite": {
			"Fn::Equals": [
				{
					"Ref": "unauthPermissions"
				},
				"w"
			]
		},
		"EnableAuthReadWrite": {
			"Fn::Equals": [
				{
					"Ref": "authPermissions"
				},
				"rw"
			]
		},
		"EnableAuthRead": {
			"Fn::Equals": [
				{
					"Ref": "authPermissions"
				},
				"r"
			]
		},
		"EnableAuthWrite": {
			"Fn::Equals": [
				{
					"Ref": "authPermissions"
				},
				"w"
			]
		}
	},
	"Resources": {
		"InvokePhotoProcessorLambda": {
			"Type" : "AWS::Lambda::Permission",
			"Properties" : {
				"Action" : "lambda:InvokeFunction",
				"FunctionName" : "workshopphotoprocessor",
				"Principal" : "s3.amazonaws.com",
				"SourceAccount" :  { "Ref": "AWS::AccountId" },
				"SourceArn": "arn:aws:s3:::REPLACE_WITH_USERFILES_BUCKET_NAME"
			}
		},
		"S3Bucket": {
			"Type": "AWS::S3::Bucket",
			"DeletionPolicy" : "Retain",
			"Properties": {
				"BucketName": {
                    "Fn::If": [
                        "ShouldNotCreateEnvResources",
                        {
                            "Ref": "bucketName"
                        },
                        {
                            "Fn::Join": [
                                "",
                                [
                                    {
                                        "Ref": "bucketName"
                                    },
                                    "-",
                                    {
                                        "Ref": "env"
                                    }
                                ]
                            ]
                        }
                    ]
                },
				"CorsConfiguration": {
					"CorsRules": [
						{
							"AllowedHeaders": [
								"*"
							],
							"AllowedMethods": [
								"GET",
								"HEAD",
								"PUT",
								"POST",
								"DELETE"
							],
							"AllowedOrigins": [
								"*"
							],
							"ExposedHeaders": [
								"x-amz-server-side-encryption",
								"x-amz-request-id",
								"x-amz-id-2"
							],
							"Id": "S3CORSRuleId1",
							"MaxAge": "3000"
						}
					]
				},
				"NotificationConfiguration": {
					"LambdaConfigurations": [
						{
							"Function": {
								"Fn::Join": [":", [
									"arn:aws:lambda",
									{ "Ref": "AWS::Region" },
									{ "Ref": "AWS::AccountId" },
									"function",
									"workshopphotoprocessor"
									]
								]
							},
							"Event": "s3:ObjectCreated:Put",
							"Filter": {
								"S3Key": {
									"Rules": [ 
										{ "Name": "prefix", "Value": "uploads/" }
									]
								}
							}
						}
					]
				}
			}
		},
		"DenyListS3Buckets": {
			"DependsOn": [ "S3Bucket" ],
			"Type": "AWS::IAM::Policy",
			"Properties": {
				"PolicyName": "DenyListS3Buckets",
				"Roles": [ { "Ref": "authRoleName" } ],
				"PolicyDocument": {
					"Version": "2012-10-17",
					"Statement": [
						{
							"Effect": "Deny",
							"Action": [ "s3:ListBucket" ],
							"Resource": ["*"]
						}
					]
				}
			}
		},
		"S3UnauthPolicyRW": {
			"Condition": "EnableUnauthReadWrite",
			"DependsOn": [
				"S3Bucket"
			],
			"Type": "AWS::IAM::Policy",
			"Properties": {
				"PolicyName": {
					"Ref": "authPolicyName"
				},
				"Roles": [
					{
						"Ref": "unauthRoleName"
					}
				],
				"PolicyDocument": {
					"Version": "2012-10-17",
					"Statement": [
						{
							"Effect": "Allow",
							"Action": [
								"s3:GetObject",
								"s3:PutObject",
								"s3:DeleteObject"
							],
							"Resource": [
								{
									"Fn::Join": [
										"",
										[
											"arn:aws:s3:::",
											{
												"Ref": "S3Bucket"
											},
											"/public/*"
										]
									]
								}
							]
						},
						{
							"Effect": "Allow",
							"Action": [
								"s3:PutObject"
							],
							"Resource": [
								{
									"Fn::Join": [
										"",
										[
											"arn:aws:s3:::",
											{
												"Ref": "S3Bucket"
											},
											"/uploads/*"
										]
									]
								}
							]
						},
						{
							"Effect": "Allow",
							"Action": [
								"s3:GetObject"
							],
							"Resource": [
								{
									"Fn::Join": [
										"",
										[
											"arn:aws:s3:::",
											{
												"Ref": "S3Bucket"
											},
											"/protected/*"
										]
									]
								}
							]
						},
						{
							"Effect": "Allow",
							"Action": [
								"s3:ListBucket"
							],
							"Resource": [
								{
									"Fn::Join": [
										"",
										[
											"arn:aws:s3:::",
											{
												"Ref": "S3Bucket"
											}
										]
									]
								}
							],
							"Condition": {
								"StringLike": {
									"s3:prefix": [
										"public/",
										"public/*",
										"protected/",
										"protected/*"
									]
								}
							}
						}
					]
				}
			}
		},
		"S3UnauthPolicyR": {
			"Condition": "EnableUnauthRead",
			"DependsOn": [
				"S3Bucket"
			],
			"Type": "AWS::IAM::Policy",
			"Properties": {
				"PolicyName": {
					"Ref": "authPolicyName"
				},
				"Roles": [
					{
						"Ref": "unauthRoleName"
					}
				],
				"PolicyDocument": {
					"Version": "2012-10-17",
					"Statement": [
						{
							"Effect": "Allow",
							"Action": [
								"s3:ListBucket"
							],
							"Resource": [
								{
									"Fn::Join": [
										"",
										[
											"arn:aws:s3:::",
											{
												"Ref": "S3Bucket"
											}
										]
									]
								}
							],
							"Condition": {
								"StringLike": {
									"s3:prefix": [
										"public/",
										"public/*",
										"protected/",
										"protected/*"
									]
								}
							}
						},
						{
							"Effect": "Allow",
							"Action": [
								"s3:GetObject"
							],
							"Resource": [
								{
									"Fn::Join": [
										"",
										[
											"arn:aws:s3:::",
											{
												"Ref": "S3Bucket"
											},
											"/protected/*"
										]
									]
								},
								{
									"Fn::Join": [
										"",
										[
											"arn:aws:s3:::",
											{
												"Ref": "S3Bucket"
											},
											"/public/*"
										]
									]
								}
							]
						}
					]
				}
			}
		},
		"S3UnauthPolicyW": {
			"Condition": "EnableUnauthWrite",
			"DependsOn": [
				"S3Bucket"
			],
			"Type": "AWS::IAM::Policy",
			"Properties": {
				"PolicyName": {
					"Ref": "authPolicyName"
				},
				"Roles": [
					{
						"Ref": "unauthRoleName"
					}
				],
				"PolicyDocument": {
					"Version": "2012-10-17",
					"Statement": [
						{
							"Effect": "Allow",
							"Action": [
								"s3:PutObject",
								"s3:DeleteObject"
							],
							"Resource": [
								{
									"Fn::Join": [
										"",
										[
											"arn:aws:s3:::",
											{
												"Ref": "S3Bucket"
											},
											"/public/*"
										]
									]
								}
							]
						},
						{
							"Effect": "Allow",
							"Action": [
								"s3:PutObject"
							],
							"Resource": [
								{
									"Fn::Join": [
										"",
										[
											"arn:aws:s3:::",
											{
												"Ref": "S3Bucket"
											},
											"/uploads/*"
										]
									]
								}
							]
						}
					]
				}
			}
		},
		"S3AuthPolicyRW": {
			"Condition": "EnableAuthReadWrite",
			"DependsOn": [
				"S3Bucket"
			],
			"Type": "AWS::IAM::Policy",
			"Properties": {
				"PolicyName": {
					"Ref": "authPolicyName"
				},
				"Roles": [
					{
						"Ref": "authRoleName"
					}
				],
				"PolicyDocument": {
					"Version": "2012-10-17",
					"Statement": [
						{
							"Effect": "Allow",
							"Action": [
								"s3:GetObject",
								"s3:PutObject",
								"s3:DeleteObject"
							],
							"Resource": [
								{
									"Fn::Join": [
										"",
										[
											"arn:aws:s3:::",
											{
												"Ref": "S3Bucket"
											},
											"/public/*"
										]
									]
								},
								{
									"Fn::Join": [
										"",
										[
											"arn:aws:s3:::",
											{
												"Ref": "S3Bucket"
											},
											"/protected/${cognito-identity.amazonaws.com:sub}/*"
										]
									]
								},
								{
									"Fn::Join": [
										"",
										[
											"arn:aws:s3:::",
											{
												"Ref": "S3Bucket"
											},
											"/private/${cognito-identity.amazonaws.com:sub}/*"
										]
									]
								}
							]
						},
						{
							"Effect": "Allow",
							"Action": [
								"s3:PutObject"
							],
							"Resource": [
								{
									"Fn::Join": [
										"",
										[
											"arn:aws:s3:::",
											{
												"Ref": "S3Bucket"
											},
											"/uploads/*"
										]
									]
								}
							]
						},
						{
							"Effect": "Allow",
							"Action": [
								"s3:GetObject"
							],
							"Resource": [
								{
									"Fn::Join": [
										"",
										[
											"arn:aws:s3:::",
											{
												"Ref": "S3Bucket"
											},
											"/protected/*"
										]
									]
								}
							]
						},
						{
							"Effect": "Allow",
							"Action": [
								"s3:ListBucket"
							],
							"Resource": [
								{
									"Fn::Join": [
										"",
										[
											"arn:aws:s3:::",
											{
												"Ref": "S3Bucket"
											}
										]
									]
								}
							],
							"Condition": {
								"StringLike": {
									"s3:prefix": [
										"public/",
										"public/*",
										"protected/",
										"protected/*",
										"private/${cognito-identity.amazonaws.com:sub}/",
										"private/${cognito-identity.amazonaws.com:sub}/*"
									]
								}
							}
						}
					]
				}
			}
		},
		"S3AuthPolicyR": {
			"Condition": "EnableAuthRead",
			"DependsOn": [
				"S3Bucket"
			],
			"Type": "AWS::IAM::Policy",
			"Properties": {
				"PolicyName": {
					"Ref": "authPolicyName"
				},
				"Roles": [
					{
						"Ref": "authRoleName"
					}
				],
				"PolicyDocument": {
					"Version": "2012-10-17",
					"Statement": [
						{
							"Effect": "Allow",
							"Action": [
								"s3:ListBucket"
							],
							"Resource": [
								{
									"Fn::Join": [
										"",
										[
											"arn:aws:s3:::",
											{
												"Ref": "S3Bucket"
											}
										]
									]
								}
							],
							"Condition": {
								"StringLike": {
									"s3:prefix": [
										"public/",
										"public/*",
										"protected/",
										"protected/*"
									]
								}
							}
						},
						{
							"Effect": "Allow",
							"Action": [
								"s3:GetObject"
							],
							"Resource": [
								{
									"Fn::Join": [
										"",
										[
											"arn:aws:s3:::",
											{
												"Ref": "S3Bucket"
											},
											"/protected/*"
										]
									]
								},
								{
									"Fn::Join": [
										"",
										[
											"arn:aws:s3:::",
											{
												"Ref": "S3Bucket"
											},
											"/public/*"
										]
									]
								}
							]
						}
					]
				}
			}
		},
		"S3AuthPolicyW": {
			"Condition": "EnableAuthWrite",
			"DependsOn": [
				"S3Bucket"
			],
			"Type": "AWS::IAM::Policy",
			"Properties": {
				"PolicyName": {
					"Ref": "authPolicyName"
				},
				"Roles": [
					{
						"Ref": "authRoleName"
					}
				],
				"PolicyDocument": {
					"Version": "2012-10-17",
					"Statement": [
						{
							"Effect": "Allow",
							"Action": [
								"s3:GetObject",
								"s3:PutObject",
								"s3:DeleteObject"
							],
							"Resource": [
								{
									"Fn::Join": [
										"",
										[
											"arn:aws:s3:::",
											{
												"Ref": "S3Bucket"
											},
											"/public/*"
										]
									]
								},
								{
									"Fn::Join": [
										"",
										[
											"arn:aws:s3:::",
											{
												"Ref": "S3Bucket"
											},
											"/protected/${cognito-identity.amazonaws.com:sub}/*"
										]
									]
								},
								{
									"Fn::Join": [
										"",
										[
											"arn:aws:s3:::",
											{
												"Ref": "S3Bucket"
											},
											"/private/${cognito-identity.amazonaws.com:sub}/*"
										]
									]
								}
							]
						},
						{
							"Effect": "Allow",
							"Action": [
								"s3:PutObject"
							],
							"Resource": [
								{
									"Fn::Join": [
										"",
										[
											"arn:aws:s3:::",
											{
												"Ref": "S3Bucket"
											},
											"/uploads/*"
										]
									]
								}
							]
						},
						{
							"Effect": "Allow",
							"Action": [
								"s3:GetObject"
							],
							"Resource": [
								{
									"Fn::Join": [
										"",
										[
											"arn:aws:s3:::",
											{
												"Ref": "S3Bucket"
											},
											"/protected/*"
										]
									]
								}
							]
						},
						{
							"Effect": "Allow",
							"Action": [
								"s3:ListBucket"
							],
							"Resource": [
								{
									"Fn::Join": [
										"",
										[
											"arn:aws:s3:::",
											{
												"Ref": "S3Bucket"
											}
										]
									]
								}
							],
							"Condition": {
								"StringLike": {
									"s3:prefix": [
										"public/",
										"public/*",
										"protected/",
										"protected/*",
										"private/${cognito-identity.amazonaws.com:sub}/",
										"private/${cognito-identity.amazonaws.com:sub}/*"
									]
								}
							}
						}
					]
				}
			}
		}
	},
	"Outputs": {
		"BucketName": {
			"Value": {
				"Ref": "S3Bucket"
			},
			"Description": "Bucket name for the S3 bucket"
		},
		"Region": {
			"Value": {
				"Ref": "AWS::Region"
			}
		}
	}
}
{{< /highlight >}}
</div>

2. {{% notice warning %}}
After you paste the new template shown above, find the text **REPLACE_WITH_USERFILES_BUCKET_NAME** in your pasted template and replace it with the name of your userfiles S3 bucket. 
<br/>
<br/>
You can find this value in **photo-albums/src/aws-exports.js** under the **aws_user_files_s3_bucket** key.
{{% /notice %}}


3. **From the photo-albums directory, run:** `amplify push` to update our storage configuration. 

4. Wait for the update to complete. This step usually only takes a minute or two.

### What we changed in amplify/.../s3-cloudformation-template.json
- Added a *env* parameter, allowing Amplify to pass in the current Amplify environment name to the template

- Added a *InvokePhotoProcessorLambda* resource, giving the S3Bucket permission to invoke the PhotoProcessor lambda function.

- Added a *NotificationConfiguration* property to the S3Bucket resource, configuring the bucket to invoke our PhotoProcessor lambda function when new photos are added to the 'uploads/' prefix


- Added a *DenyListS3Buckets* IAM policy, preventing authenticated users from listing the contents of any buckets on S3


{{% notice info %}}
The default permissions for the user files S3 storage bucket set up by the Amplify CLI allows anyone logged in to our app to list the contents of the bucket for any keys that start with 'public/' (and a few other prefixes too). While our app doesn't expose this as an interaction, someone poking around might try to take their credentials from our app and make an API call to S3 directly to try and list the bucket where all the photos are going. 
<br/>
<br/>
We have no need to let users list bucket contents at all, so we've added an IAM policy to the role used by authenticated users to explicitly deny users the ability to list any S3 bucket contents. 
<br/>
<br/>
Now, nobody will be able to go directly to the S3 API and list all of the photos that our users have uploaded. We're using UUIDs for album and photo IDs, so we shouldn't have to worry about a curious user enumerating through patterns of IDs hoping to find photos to view.
{{% /notice %}}

### Try uploading another photo

With these changes completed, we should be able to upload a photo and see our Photo Processor function execute automatically. Try uploading a photo to an album, wait a moment, then refresh the page to see if the album renders the newly uploaded photo. If you see a photo, it means that our Photo Processor function was automatically triggered by the upload, it created a thumbnail, and it added all of the photo information to the DynamoDB table that our AppSync API reads from for resolving Photos. 

Refreshing the album view in order to see new photos isn’t a great user experience, but this workshop has a lot of material already and there’s still more to cover in the next section, too. In short, one way to handle this with another AppSync subscription would be to have our photo processor Lambda function trigger a mutation on our AppSync API, and to have the AlbumDetailsLoader component subscribe to that mutation. However, because we’re using Amazon Cognito User Pool authentication for our AppSync API, the only way to have our Lambda function trigger such a mutation would be to create a sort of ‘system’ user (through the normal user sign up and confirmation process), store that user’s credentials securely (perhaps in AWS Secrets Manager), and authenticate to our AppSync API as that user inside our Lambda in order to trigger the mutation. For simplicity's sake, we'll stick to just refreshing the album view for this workshop.