+++
title = "사진을 검색할 수 있게 만들기"
chapter = false
weight = 20
+++

#### GraphQL 스키마 갱신하기

이제 각 사진의 레이블을 저장할 수 있으니, AppSync API를 통해 이 데이터를 노출할 준비가 되었습니다.

DynamoDB 쿼리로 검색하는 방법도 가능하지만, Amazon Elasticsearch Service를 사용하여 데이터를 색인하고 검색 쿼리를 다루는 방식이 좀 더 유연하고 효율적입니다. 다행이 Amplify CLI는 매우 쉽게 Amazon Elasticsearch 엔드포인트를 생성하고 앱 데이터와 연결합니다.


1. **photo-albums/amplify/backend/api/photoalbums/schema.graphql** 을 다음 내용으로 변경합니다.
{{< highlight graphql "hl_lines=9 15">}}
# amplify/backend/api/photo-albums/schema.graphql

type Album @model @auth(rules: [{allow: owner}]) {
    id: ID!
    name: String!
    photos: [Photo] @connection(name: "AlbumPhotos")
}

type Photo @model @auth(rules: [{allow: owner}]) @searchable {
    id: ID!
    album: Album @connection(name: "AlbumPhotos")
    bucket: String!
    fullsize: PhotoS3Info!
    thumbnail: PhotoS3Info!
    labels: [String!]
}

type PhotoS3Info {
    key: String!
    width: Int!
    height: Int!
}
{{< /highlight >}}

2. **photo-albums 디렉터리에서** `amplify push` 실행하여 새로운 리소스를 프로비저닝합니다.

3. 갱신이 끝날때까지 기다립니다. 새로운 Amazon Elasticsearch Service 엔드포인트를 생성하는데 몇 분이 소요될 수 있습니다. **이 과정은 보통 완료까지 8분에서 12분정도 소요됩니다.**

{{% notice tip %}}
[Amplify의 GraphQL 변환](https://aws-amplify.github.io/docs/cli/graphql?sdk=js)에서 Amplify의 *@searchable* GraphQL 지시문에 대해 더 공부할 수 있습니다.
{{% /notice %}}

### 바뀐 것들
- Amplify가 Amazon Elasticsearch Service 클러스터에 사진 데이터를 연결하는 *@searchable* 지시문을 Photo 타입으로 추가했습니다.

- *Photo* 타입에 *labels* 속성을 추가하여, 사진 처리 함수에서 추가된 레이블 정보도 검색할 수 있도록 Elasticserarch Service에 사진 기록의 일부로 스트리밍합니다.


{{% notice note %}}
`amplify push` 작업이 완료되기까지 기다리는 중에 다음 장을 계속 진행할 수 있습니다.
{{% /notice %}}