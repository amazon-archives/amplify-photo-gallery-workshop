+++
title = "사진 버킷을 처리함수와 연결하기"
chapter = false
weight = 20
+++

### 새 사진이 S3 버킷에 업로드된 후에 함수 동작시키기
사진 처리 함수를 만들었으니 이제는 함수를 실행하는 트리거를 설정해야합니다. 앨범에 업로드된 모든 사진을 처리해야 하기 때문에, Amplify로 생성한 S3 사용자 파일 버킷의 구성을 수정하여 이러한 변경 작업을 수행합니다.

1. **photo-albums/amplify/backend/storage/photoalbumsstorage/s3-cloudformation-template.json** 파일을 다음 내용으로 변경해주십시요.
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
위에 표시된 새 템플릿을 붙여넣기 하고 나서, **REPLACE_WITH_USERFILES_BUCKET_NAME** 항목을 찾아서 사용자 파일 S3 버킷의 이름으로 바꿉니다.
<br/>
<br/>
이 값은 **photo-albums/src/aws-exports.js** 파일의 **aws_user_files_s3_bucket** 항목의 키 값으로 찾을 수 있습니다.
{{% /notice %}}


3. **photo-albums 디렉터리에서** `amplify push` 실행하여 저장소 구성을 갱신합니다.

4. 완료될 때까지 기다립니다. 이 단계는 1~2분 정도 소요됩니다.

### amplify/.../s3-cloudformation-template.json 에서 변경한 내용
- Amplify가 현재 Amplify 환경이름을 템플릿으로 전달할 수 있도록 *env* 파라미터를 추가하였습니다.

- PhotoProcessor 람다 함수를 호출할 수 있도록 S3Bucket 리소스에 권한을 부여하는 *InvokePhotoProcessorLambda* 리소스를 추가하였습니다.

- 새 사진이 'uploads/' 접두어로 추가되었을 때에 PhotoProcessor 람다함수를 호출하도록 버킷을 구성하게 S3Bucket 리소스에 *NotificationConfiguration* 속성을 추가하였습니다.


- 인증된 사용자가 S3 버킷 내용 목록을 보는 것을 방지하기 위해 *DenyListS3Buckets* 라는 IAM 정책을 추가하였습니다.


{{% notice info %}}
S3 스토리지의 사용자 파일의 기본 권한은 Amplify CLI에서 'public/'(과 다른 일부 접두어도)으로 시작하는 버킷이라면 앱에 로그인한 사용자가 버킷 내용을 나열할 수 있게 설정합니다. 이런 상호작용은 앱에서 노출하지 않으니, 앱을 찔러보는 누군가는 앱에 자격증명(credential)을 가져와서 S3 API를 직접 호출하여 모든 사진이 있는 버킷을 나열하는 시도를 할 수 있습니다.
<br/>
<br/>
사용자가 버킷 내용을 모두 열거할 필요는 없으니 인증된 사용자가 S3 버킷 내용을 나열 할 수 있는 기능을 명시적으로 거부하도록 IAM 정책을 역할로 추가했습니다.
<br/>
<br/>
이제 아무도 S3 API로 직접 호출하여 사용자가 업로드한 사진을 나열할 수 없습니다. 앨범과 사진의 ID로 UUID를 사용하기 때문에 사진을 찾기 위해 ID 패턴을 열거하는 호기심 많은 사용자들도 걱정할 필요없습니다.
{{% /notice %}}

### 다른 사진 업로드 시도

이러한 변경 사항이 완료되면, 사진을 업로드할 수 있고 사진 처리 함수가 자동으로 실행되는 것을 확인할 수 있습니다. 사진을 앨범에 업로드하고 잠시 기다린 다음 페이지를 새로 고침하여 앨범이 새로 업로드된 사진을 표시하는지 확인하십시요. 사진이 표시되면 사진 처리 함수가 업로드에 의해 자동으로 시작되어 썸네일 이미지가 생성되고 AppSync API가 읽은 처리된 사진의 정보들도 DynamoDB 테이블에 모두 추가되었음을 의미합니다.

새로운 사진을 보기 위해 앨범보기를 새로 고치는 것은 좋은 사용자 경험이 아니지만, 이 워크샵에는 이미 많은 내용이 있고 다음장에도  더 많은 내용이 수록되어 있습니다. 짧게 말씀드려본다면, 다른 AppSync 구독으로 이것을 처리하는 한가지 방법은 사진 처리 람다 함수가 AppSync API에서 수정사항을 발생시키고 AlbumDetailsLoader 컴포넌트에서 해당 수정사항을 구독하는 것입니다. 그런데 AppSync API에 Amazon Cognito 사용자 풀 인증을 사용하고 있기 때문에, 람다 기능을 통해 이러한 수정사항을 일으키는 유일한 방법은 일종의 '시스템' 사용자를 만들고(일반 사용자 가입 및 확인 프로세스를 통해), 사용자 자격증명을 안전하게 저장하고(AWS Secrets Manager 등으로), 수정사항을 유발하도록 람다 내부에서 AppSync API에 사용자로서 인증하는 방법입니다. 간단히 하기위해 여기서는 계속해서 앨범보기를 새로 고치는 방법으로 진행할 것입니다.