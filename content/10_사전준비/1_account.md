+++
title = "AWS account 생성하기"
chapter = false
weight = 1
+++

{{% notice warning %}}
 Workshop에서 사용하고자 하는 AWS 계정은 새로운 IAM 역할을 만들수 있어야 하고 다른 IAM 권한 범위를 지정할 수 있어야 합니다.
{{% /notice %}}

{{% notice tip %}}
이미 AWS 계정을 가지고 있고, IAM 관리자 접속 권한이 있다면 이 페이지를 넘어가도 좋습니다.
{{% /notice %}}

1. **관리자 접속 권한 계정이 없다면**: [새로 하나 만듭시다.](https://aws.amazon.com/getting-started/)

1. AWS 계정을 가지게 되었다면, 남은 워크샵 단계를 잘 따르고 있는 확인해보세요.  
AWS 계정에 대한 관리자 권한이 있는 **IAM user** : 
[워크샵에서 사용할 IAM user를 만듭니다.](https://console.aws.amazon.com/iam/home?region=us-east-1#/users$new)

1. 사용자 상세정보를 입력합니다:
![Create User](/images/iam-1-create-user.png)

1. AdministratorAccess IAM 정책 연결:
![Attach Policy](/images/iam-2-attach-policy.png)

1. create the new user 클릭:
![Confirm User](/images/iam-3-create-user.png)

1. login URL 저장:
![Login URL](/images/iam-4-save-url.png)
