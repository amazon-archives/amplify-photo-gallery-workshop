+++
title = "Querie 수행하기"
chapter = false
weight = 20
+++


**AWS Console로 접근하여 photoalbums API를 클릭합니다**. 이제 API를 파고들어봅시다.

{{% tabs %}}
{{% tab "us-east-1" "North America" %}}
Link to [AWS AppSync web console in Northern Virgina](https://console.aws.amazon.com/appsync/home?region=us-east-1#/apis)
{{% /tab %}}

{{% tab  "eu-west-1"  "Europe" %}}
Link to [AWS AppSync web console in Ireland](https://console.aws.amazon.com/appsync/home?region=eu-west-1#/apis)
{{% /tab %}}
{{% /tabs %}}

왼쪽 사이드바에 있는 **Queries를 클릭합니다.** 

![appsync queries](/images/appsync_queries.png?classes=border)

{{% notice info %}}
AWS AppSync의 대화형 쿼리 실행 영역인 이곳에서 쿼리를 작성하거나 변경하고, 쿼리를 실행하여 결과를 볼 수 있습니다. 
이는 Resolver들이 우리가 예상한 대로 잘 작동하는지 테스트하기 위한 좋은 방법입니다.
{{% /notice %}}

### AppSync 인증

{{% notice warning %}}
쿼리를 실행하기 전에 사용자 인증이 필요합니다.
(AppSync API는  Application 인증을 구현할때 세팅한 Amazon Congnito 사용자 Pool을 통하여 인증하도록 설정되어 있기 때문)
{{% /notice %}}

1. 쿼리 에디터 상단에 있는 **Login with User Pools 버튼을 클릭하세요.**

1. **ClientId** 필드의 값을 확인합니다.
    1.  Cloud9에서 **photo-albums/src/aws-exports.js 파일을 오픈합니다.**
    2.  **aws_user_pools_web_client_id** 속성의 값을 **복사** 하세요.

1. **ClientId** 필드에 복사한 값을 **붙여넣습니다.**

1.  인증 정보를 추가할때 생성한 사용자 **credentials 을 입력하세요.**

1. **Login 클릭**

### 쿼리 수행하기

이제 다음 쿼리와 Mutations를 수행하면 됩니다. 쿼리와 mutations 실행을 위해 주황색 'play' 버튼을 클릭하세요.

**새로운 앨범 추가하기** : 다음 문장을 복사 붙여넣기 하여 쿼리를 실행합니다.

    mutation {
        createAlbum(input:{name:"First Album"}) {
            id
            name
        }
    }

**다른 앨범 추가하기** : 다른 앨범 이름으로 createAlbum mutation를 수정하고 재실행 합니다.

    mutation {
        createAlbum(input:{name:"Second Album"}) {
            id
            name
        }
    }

**앨범 목록 조회하기**  : 다음 쿼리를 실행합니다.

    query {
        listAlbums {
            items {
                id
                name
            }
        }
    }

보다시피, GraphQL 쿼리와 mutation으로 데이터를 읽고 작성할 수 있습니다. AppSync는 데이터 조회와 데이터 보존(Persisting)을 담당합니다.(이 예시는 DynamoDB에 해당).