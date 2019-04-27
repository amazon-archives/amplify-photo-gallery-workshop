+++
title = "Cloud Storage 추가하기"
chapter = false
weight = 30
+++

앨범에 업로드한 모든 사진들을 보관할 저장소가 필요합니다. Amazon Simple Storage Service (S3)는 이를 위한 좋은 서비스이기도 하고 Amplify의 스토리지 모듈을 이용하면 S3에 대한 설정과 작업이 아주 쉽습니다.

### 스토리지 구성 및 추가

 먼저 Amplify CLI를 사용하여 스토리지를 활성화합니다. Amazon S3에 버킷이 생성되고 적절한 권한으로 설정되어 앱에 로그인 한 사용자가 읽고 쓸 수 있습니다. 또한 앨범을 공개 하는 경우 인증되지 않은 게스트 사용자가 버킷을 읽을 수 있도록 허용합니다.

### Configuring and adding storage

1. **사진앨범 디렉토리에서 다음 명령어를 수행합니다.** `amplify add storage`

2. 명령창에서 **'Content'를 선택하세요**

3. 리소스 카테고리 및 버킷 이름에 **값을 입력하거나 기본값** 을 수락합니다.

4. **인증된 사용자들은 읽기/쓰기 권한에**. 접근할 수 있도록 설정하고, **게스트들** 에게는 **읽기 권한** 만 설정합니다.

    응답 예시는 다음과 같습니다.:

    ```text
    $ amplify add storage


    ? Please select from one of the below mentioned services:
    
    Content (Images, audio, video, etc.)


    ? Please provide a friendly name for your resource that will be used to label this category in the proje
    ct: photoalbumsstorage


    ? Please provide bucket name: <accept the default value>


    ? Who should have access: Auth users only


    ? What kind of access do you want for Authenticated users? 
    ◉ create/update
    ◉ read
    ◉ delete


    ? What kind of access do you want for Guest users? 
    ◯ create/update
    ◉ read
    ◯ delete
    ```


Amplify는 방금 추가 한 스토리지 리소스를 프로비저닝하여 클라우드 환경을 수정하게 됩니다.

1. **다음 명령어를 실행합니다.** `amplify push` 
2. 바뀐 내용을 확인하기 위해 **Enter를 누릅니다.** 
3. 프로비저닝이 완료 될 때까지 기다립니다. 저장 용량을 추가하는 데는 보통 1-2 분 정도 소요됩니다.

{{% notice info %}}
Amplify는 게스트 사용자의 읽기권한을 허용하도록 설정했기 때문에 앨범을 공개하는데 S3 bucket 권한 설정을 변경 할 필요가 없습니다. 하지만 이번 워크샵에서는 앨범을 공개적으로 조회할 수 있도록 하지 않겠습니다.
{{% /notice %}}

{{% notice tip %}}
Amplify 스토리지 모듈에 대해 다음 자료를 참고하세요. [here](https://aws-amplify.github.io/amplify-js/media/storage_guide).
{{% /notice %}}
