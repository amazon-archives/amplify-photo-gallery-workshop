+++
title = "축하드립니다!"
chapter = false
weight = 10
+++

실제로 상용할 응용프로그램을 만들어보진 못했지만, 우린 확실하게 공유가능한 사진 앨범 웹 앱을 만들어보았습니다.   

우리가 해낸 모든 것들을 되돌아봅시다. 우리는.. :

- 간단한 리엑트(React) 웹 앱을 시작했습니다.

- 사용자 인증을 추가하여 완벽한 회원가입과 로그인을 구현했습니다.

- DynamoDB 테이블로 적재할 사진 앨범들이 안전하게 관리되도록 AWS AppSync의 GraphQL API를 생성하였습니다.

- Added the ability to create and view albums

- Added the ability to upload photos to an album, complete with automatic thumbnail creation

- Introduced 'load more...' pagination for albums with many photos

- Added automatic label detection for photos

- Added the ability to search for all photos for a given label (scoped by each user's album permissions)

- Built a production-ready version of the app and deployed it to S3 for web hosting

The backend for our photo albums app is entirely serverless, which means it's extremely cost efficient, scalable, and highly available thanks to services from AWS. 

Not bad for a few hours of work! 

Please give yourself a **huge pat on the back** for making it all the way to the end!

### What will _you_ build next?