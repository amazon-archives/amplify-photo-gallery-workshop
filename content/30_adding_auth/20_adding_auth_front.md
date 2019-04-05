+++
title = "프론트엔드 렌더링"
chapter = false
weight = 20
+++

이제 등록과 로그인을 관리하는 백엔드가 구성되었으니 _withAuthenticator_ [AWS Amplify의 상위 리액트 컴포넌트](https://aws-amplify.github.io/amplify-js/media/authentication_guide.html#using-components-in-react)를 이용해서 기존 _App_ 컴포넌트를 감싸도록 합니다. 그러면 앱에서 사용자 등록, 확인, 로그인, 로그 아웃, 비밀번호 재설정을 할 수 있는 간단한 UI를 제공합니다.

### Amplify NPM 종속성 추가

아직 *aws-amplify*, *aws-amplify-react* 모듈을 앱에 추가하지 않았으니 이제 추가합니다.

1. `npm install --save aws-amplify aws-amplify-react`을 **실행합니다.**

1. **src/App.js 내용을 다음으로 교체합니다.**
{{< highlight jsx "hl_lines=6-9 22">}}
// src/App.js

import React, { Component } from 'react';
import { Header } from 'semantic-ui-react';

import Amplify from 'aws-amplify';
import aws_exports from './aws-exports';
import { withAuthenticator } from 'aws-amplify-react';
Amplify.configure(aws_exports);


class App extends Component { 
    render() { 
        return (
            <div>
                <Header as='h1'>Hello World!</Header>
            </div>
        );
    }
}

export default withAuthenticator(App, {includeGreetings: true});
{{< /highlight >}}

이제 웹 앱을 살펴보면, 사용자 등록과 로그인 양식을 갖게 되었음을 알 수 있습니다!

### App.js에서 변경한 것들

- AWS Amplify JS 라이브러리를 임포트하고 구성했습니다.

- aws-amplify-react에서 withAuthenticator 상위 컴포넌트를 임포트했습니다.

- withAuthenticator로 App 컴포넌트를 감쌌습니다.

### 계정 생성하기

**앱에서 계정을 생성**하려면 사용자명, 암호와 **유효한 이메일 주소**(확인 코드를 수신할)가 필요합니다.

{{% notice info %}}
코드를 확인하라는 화면이 보여집니다. 이는 Amazon Cognito가 로그인할 수 있게 하기 전에 사용자의 이메일 주소를 검증하기 때문입니다.
{{% /notice %}}

**이메일을 확인하십시요**. 확인 코드를 받았을 것입니다. **확인 코드를 복사하고 앱에 붙여넣기** 하면 가입시 입력한 사용자명과 비밀번호로 로그인할 수 있습니다.

로그인하면 로그인 양식은 사라지고 사용자명과 'Sing Out' 버튼이 포함된 헤더바 아래로 랜더링된 App 컴포넌트를 볼 수 있습니다.

{{% notice tip %}}
지금은 꽤 간단한 인증 UI이지만 직접 리액트 컴포넌트를 교체하거나 앱으로 리다이렉션할 수 있는 완전히 호스트된 UI를 사용하는 등의 많은 것을 사용자가 정의할 수 있습니다. 자세한 내용은 [AWS Amplify 인증 가이드](https://aws.github.io/aws-amplify/media/authentication_guide#customization)의 사용자 정의 항목을 보십시요.
{{% /notice %}}