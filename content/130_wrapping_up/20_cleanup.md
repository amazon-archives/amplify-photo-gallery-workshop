+++
title = "리소스 삭제하기"
chapter = false
weight = 20
+++

### Amplify로 삭제하기

Amplify는 우리가 이번 워크샵에서 프로비저닝했던 모든 리소스들을 삭제하는 작업을 할 수 있습니다 (프로비저닝된 CloudFormation 중첩스택을 삭제하는 작업을 시도합니다). 그러나 몇가지 리소스들은 수동으로 삭제해줘야 합니다. (삭제 거부)

1. **photo-albums 디렉토리에서** `amplify delete`를 실행하고 삭제를 확인하기 위해 *Enter* 키를 누릅니다.

2. Amplify가 리소스들을 삭제하는 동안 **기다립니다.**

### 삭제 작업이 실패한 일부 리소스를 수동으로 삭제하기

이제 [CloudFormation stacks console](https://console.aws.amazon.com/cloudformation/home?region=ap-northeast-2#/stacks)로 이동해서 'DELETE FAILED'상태표시를 나타내는 몇개의 스택들을 클릭합니다. 삭제 실패된 원인과 무엇이 실패되었는지를 보실 수 있습니다.

CloudFormation이 스택들을 삭제하려고 할 때 인증된 사용자의 IAM역할이 있다고 하더라도 연동된 정책들이 남아 있다면 이 때문에 삭제 작업이 실패합니다. 하지만 이 시점에서 연동된 정책들 역시 모두 삭제 되어야하며 다른 스택 삭제 작업도 성공해야 합니다.

1. 삭제실패된 **스택을 선택합니다.**

2. **Actions을 클릭합니다.**

3. **스택삭제**를 선택합니다.

4. Auth 역할을 **클릭해제**하고, **예, 삭제합니다**를 클릭합니다.

5. 성공적으로 삭제되었는지 확인합니다. 만약 삭제되지 않았다면, [IAM Roles console](https://console.aws.amazon.com/iam/home?#/roles)으로 이동한 후, 해당역할( 'photoalbums'로 시작합니다 )을 검색해서 선택 및 삭제해주세요.

Amplify가 생성한 S3 버킷은 자동으로 삭제되지 않습니다. 버킷을 삭제하려면 다음 단계를 따르세요 :

1. [S3 console](https://s3.console.aws.amazon.com/s3/home?region=ap-northeast-2)로 이동합니다.

2. **생성일자** 열을 클릭하여 최근생성된 버킷들을 순차적으로 정렬합니다.

3. 각 _photoalbums*_ 버킷별로 클릭하고 **버킷 삭제** 버튼을 클릭하여 삭제 확인을 하기위해 버킷명을 복사/붙여넣기합니다.


### Cloud9 워크스페이스 삭제하기

1. [Cloud9 Environment](https://ap-northeast-2.console.aws.amazon.com/cloud9/home?region=ap-northeast-2)로 이동합니다.

2. **workshop**으로 생성된 개발환경을 선택 후 **삭제**를 누릅니다.

3. 확인란에 '삭제'구문을 입력하고 **삭제**를 클릭합니다.
