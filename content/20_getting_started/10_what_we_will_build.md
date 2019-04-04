+++
title = "무엇을 빌드하나"
chapter = false
weight = 10
+++

### 목표
이 워크샵에서 다음을 포함한 몇 가지 기능이 있는 앱을 빌드합니다.

* 사용자 등록과 인증을 지원해서 사진 앨법을 누가 소유했는지 알 수 있습니다.

* API 서버를 빌드하여 프론트엔드는 사용자에게 맞는 앨범과 사진을 적재할 수 있습니다.

* 누가 무엇을 볼 수 있는가에 권한 정보, 앨범, 사진을 저장하여 API는 조회와 저장을 위한 빠르고 신뢰성있는 저장소를 갖습니다.

* 사진을 저장하고 제공하며 사용자가 앨범에 업로드하는 모든 사진을 저장할 수 있습니다.

* 자동으로 사진 썸네일을 작성하여 사용자가 포토 앨범 목록을 살펴볼 때에 전체 해상도의 사진을 제공하지 않습니다.

* 자동으로 업로드한 사진과 연관된 레이블을 감지하고 이에 기반하여 검색 할 수 있게 합니다.

### 구성도

다음은 앞으로 사용할 서비스와 각각이 어떻게 연결되었는지 표시한 구성도입니다.

![Serverless Photo Albums Architecture](/images/architecture.png)

### 사용 도구

위에 언급한 각각의 문제를 처리할 수 있는 확장 가능하고 고가용성의 시스템을 만들고자 한다면, 아마 결코 앱을 만들 수 없을 것입니다! 다행히 AWS는 현대적이고 견고한 애플리케이션 구축에 필요하지만 무겁고 많은 묶인 짐을 다룰 수 있는 서비스와 도구를 제공합니다. 우리는 다음의 다양한 도구와 서비스를 사용할 것입니다.

* [AWS Amplify CLI](https://github.com/aws-amplify/amplify-cli)는 클라우드 서비스를 빠르게 프로비저닝하고 구성합니다.

* [AWS Amplify JavaScript 라이브러리](https://aws-amplify.github.io/)는 프론트와 클라우드 리소스를 연결합니다.

* [Amazon Cognito](https://aws.amazon.com/cognito/)는 사용자 등록과 인가를 처리합니다.

* [Amazon Simple Storage Service](https://aws.amazon.com/s3/) (S3)는 사용자가 업로드한 많은 사진을 저장하고 제공하며 앱의 정적 에셋을 호스팅합니다.

* [Amazon DynamoDB](https://aws.amazon.com/dynamodb/)는 사진과 앨범 데이터에 대한 API 쿼리를 수밀리초 응답으로 제공합니다.

* [AWS AppSync](https://aws.amazon.com/appsync/)는 프론트엔드에 GraphQL API를 호스팅합니다.

* [AWS Lambda](https://aws.amazon.com/lambda/)는 클라우드에서 사진의 썸네일을 비동기적으로 생성합니다.

* [Amazon Rekognition](https://aws.amazon.com/rekognition/)는 업로드한 사진의 연관된 레이블을 감지합니다.

* [Amazon Elasticsearch Service](https://aws.amazon.com/elasticsearch-service/)는 사진의 레이블을 검색하고 색인을 생성합니다.

이 서비스의 일부 혹은 전부가 다 새로울 지라도 걱정하지 마십시오. 위에 언급한 모든 것을 사용해서 시작할 때에 알아야 할 모든 것을 다룰 것입니다. 무엇보다 빌드보다 더 좋은 배움의 방법은 없으니 시작합시다!