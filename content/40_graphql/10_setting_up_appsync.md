+++
title = "AppSync 세팅"
chapter = false
weight = 10
+++

이제 인증된 사용자를 가지고 앨범을 만들기 위한 API를 만들어 봅시다. 이 앨범에는 아직 사진이 없고 단순히 이름과 앨범을 생성한 사용자 이름만 있을 것입니다.

{{% notice info %}}
[AWS AppSync](https://aws.amazon.com/appsync/)를 사용하여 API를 구현하고, 데이터 기반 어플리케이션을 구현하기 위하여 관리형 GraphQL 서비스를 사용합니다. 아직 GraphQL이 익숙하지 않다면 워크샵 단계를 진행하기 전에 시간을 내어 다음 자료를 살펴 보세요. [https://graphql.github.io/learn/](https://graphql.github.io/learn/)
단계를 계속하는 동안에도 질문이 생긴다면 위 자료를 참조하시기 바랍니다.
{{% /notice %}}

![AWS AppSync: Rapid prototyping and development with GraphQL](/images/appsync-logo.png)

### AWS AppSync API 추가하기

**photo-albums 디렉토리에서 다음 명령어를 수행하세요**  `amplify add api`   
수행결과는 다음과 같습니다.
```text
$ amplify add api 

? Please select from one of the below mentioned services
GraphQL

? Provide API name:
photoalbums

? Choose an authorization type for the API
Amazon Cognito User Pool

? Do you have an annotated GraphQL schema? 
No

? Do you want a guided schema creation? 
Yes

? What best describes your project: 
One-to-many relationship (e.g., “Blogs” with “Posts” and “Comments”)

? Do you want to edit the schema now? 
Yes

Please manually edit the file created at /home/ec2-user/environment/photo-albums/amplify/backend/api/photoalbums/schema.graphql

? Press enter to continue 
```


### GraphQL Schema 정의

앨범과 사진을 저장하고 조회하기 위한 스키마 정의입니다.

1. 다음 경로의 파일에 **photo-albums/amplify/backend/api/photoalbums/schema.graphql** 아래 내용을 복사하여 붙여넣습니다. 예제 스키마 컨텐츠를 대체합니다. 파일을 저장하는 것을 잊지 마세요. 

    참고 : Cloud9에서 터미널의 파일 이름에 마우스를 올려 놓고 클릭 한 다음 '열기'를 선택할 수 있습니다.

    ```graphql
    # amplify/backend/api/photo-albums/schema.graphql

    type Album @model @auth(rules: [{allow: owner}]) {
        id: ID!
        name: String!
        photos: [Photo] @connection(name: "AlbumPhotos")
    }

    type Photo @model @auth(rules: [{allow: owner}]) {
        id: ID!
        album: Album @connection(name: "AlbumPhotos")
        bucket: String!
        fullsize: PhotoS3Info!
        thumbnail: PhotoS3Info!
    }

    type PhotoS3Info {
        key: String!
        width: Int!
        height: Int!
    }
    ```

1. 명령 프롬프트로 돌아가서 **Enter 를 한번만 눌러** 계속 진행합니다.

1. `amplify push` **명령어를 수행하세요** 그리고 업데이트를 계속 진행할 것인지 확인합니다.

1. 코드 생성에 대한 메세지가 표시되면, **'No'**를 선택합니다.

1. Amplify가 새로운 리소스를 프로비저닝하는 동안 몇 분 정도 기다립니다.

{{% notice info %}}
이제 Code 작성 없이 앨범과 사진 데이터에 대하여 CRUDL 작업을 수행할 수 있는 GraphQL API가 생겼습니다!
<br/><br/>
AWS AppSync가 필드를 데이터로 변환하는 방식이 숨겨져 있는것은 아니니 걱정하지 마세요. 자동으로 생성된 각 resolver들은 우리가 보기에 적절하도록 수정 할 수 있습니다. (다음 단계에서 확인 할수 있습니다) 지금은 앨범을 몇개 추가하고, 그것들을 리스트로 조회해 보겠습니다.
{{% /notice %}}