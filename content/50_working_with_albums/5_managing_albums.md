+++
title = "Managing Albums"
chapter = false
weight = 5
+++

At this point, we have a web app that authenticates users and a secure GraphQL API endpoint that lets us create and read Album data. It's time to connect the two together!

{{% notice info %}}
As we saw above, [AWS Amplify](https://aws.github.io/aws-amplify/) is an open source JavaScript library that makes it very easy to integrate a number of cloud services into your web or React Native apps. We'll start by using its [Connect React component](https://aws-amplify.github.io/docs/js/api#connect) to take care of automatically querying our GraphQL API and providing data for our React components to use when rendering.
<br/><br/>
The Amplify CLI has already taken care of making sure that our *src/aws-exports.js* file contains all of the configuration we'll need to pass to the Amplify JS library in order to talk to the AppSync API. All we'll need to do is add some new code to interact with the API.
{{% /notice %}}

Here's what it will look like when we render our list of Albums:

![Rendering a list of albums in our app](/images/app-albums-screen.png?classes=border)

### Updating our App

Let's update our front-end to:
- allow users to create albums
- show a list of albums
- allow users to click into an album to view its details

**From the photoalbums directory, run** `npm install --save react-router-dom` to **add a new dependency** for routing. 

{{% notice note %}}
Usually, we'd create separate files for each of our components, but here we'll just keep everything together so we can see all of the front end code in one place.
{{% /notice %}}


**Replace photoalbums/src/App.js** with the following updated version:
{{< highlight jsx "hl_lines=5 6 8 9 14-207">}}
// src/App.js

import React, { Component } from 'react';

import { Grid, Header, Input, List, Segment } from 'semantic-ui-react';
import {BrowserRouter as Router, Route, NavLink} from 'react-router-dom';

import Amplify, { API, graphqlOperation } from 'aws-amplify';
import { Connect, withAuthenticator } from 'aws-amplify-react';

import aws_exports from './aws-exports';
Amplify.configure(aws_exports);

function makeComparator(key, order='asc') {
  return (a, b) => {
    if(!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) return 0; 

    const aVal = (typeof a[key] === 'string') ? a[key].toUpperCase() : a[key];
    const bVal = (typeof b[key] === 'string') ? b[key].toUpperCase() : b[key];

    let comparison = 0;
    if (aVal > bVal) comparison = 1;
    if (aVal < bVal) comparison = -1;

    return order === 'desc' ? (comparison * -1) : comparison
  };
}


const ListAlbums = `query ListAlbums {
    listAlbums(limit: 9999) {
        items {
            id
            name
        }
    }
}`;

const SubscribeToNewAlbums = `
  subscription OnCreateAlbum {
    onCreateAlbum {
      id
      name
    }
  }
`;


const GetAlbum = `query GetAlbum($id: ID!) {
  getAlbum(id: $id) {
    id
    name
  }
}
`;


class NewAlbum extends Component {
  constructor(props) {
    super(props);
    this.state = {
      albumName: ''
      };
    }

  handleChange = (event) => {
    let change = {};
    change[event.target.name] = event.target.value;
    this.setState(change);
  }

  handleSubmit = async (event) => {
    event.preventDefault();
    const NewAlbum = `mutation NewAlbum($name: String!) {
      createAlbum(input: {name: $name}) {
        id
        name
      }
    }`;
    
    const result = await API.graphql(graphqlOperation(NewAlbum, { name: this.state.albumName }));
    console.info(`Created album with id ${result.data.createAlbum.id}`);
    this.setState({ albumName: '' })
  }

  render() {
    return (
      <Segment>
        <Header as='h3'>Add a new album</Header>
          <Input
          type='text'
          placeholder='New Album Name'
          icon='plus'
          iconPosition='left'
          action={{ content: 'Create', onClick: this.handleSubmit }}
          name='albumName'
          value={this.state.albumName}
          onChange={this.handleChange}
          />
        </Segment>
      )
    }
}


class AlbumsList extends React.Component {
  albumItems() {
    return this.props.albums.sort(makeComparator('name')).map(album =>
      <List.Item key={album.id}>
        <NavLink to={`/albums/${album.id}`}>{album.name}</NavLink>
      </List.Item>
    );
  }

  render() {
    return (
      <Segment>
        <Header as='h3'>My Albums</Header>
        <List divided relaxed>
          {this.albumItems()}
        </List>
      </Segment>
    );
  }
}


class AlbumDetailsLoader extends React.Component {
  render() {
    return (
      <Connect query={graphqlOperation(GetAlbum, { id: this.props.id })}>
        {({ data, loading }) => {
          if (loading) { return <div>Loading...</div>; }
          if (!data.getAlbum) return;

          return <AlbumDetails album={data.getAlbum} />;
        }}
      </Connect>
    );
  }
}


class AlbumDetails extends Component {
  render() {
    return (
      <Segment>
        <Header as='h3'>{this.props.album.name}</Header>
        <p>TODO: Allow photo uploads</p>
        <p>TODO: Show photos for this album</p>
      </Segment>
    )
  }
}


class AlbumsListLoader extends React.Component {
    onNewAlbum = (prevQuery, newData) => {
        // When we get data about a new album, we need to put in into an object 
        // with the same shape as the original query results, but with the new data added as well
        let updatedQuery = Object.assign({}, prevQuery);
        updatedQuery.listAlbums.items = prevQuery.listAlbums.items.concat([newData.onCreateAlbum]);
        return updatedQuery;
    }

    render() {
        return (
            <Connect 
                query={graphqlOperation(ListAlbums)}
                subscription={graphqlOperation(SubscribeToNewAlbums)} 
                onSubscriptionMsg={this.onNewAlbum}
            >
                {({ data, loading }) => {
                    if (loading) { return <div>Loading...</div>; }
                    if (!data.listAlbums) return;

                return <AlbumsList albums={data.listAlbums.items} />;
                }}
            </Connect>
        );
    }
}


class App extends Component {
  render() {
    return (
      <Router>
        <Grid padded>
          <Grid.Column>
            <Route path="/" exact component={NewAlbum}/>
            <Route path="/" exact component={AlbumsListLoader}/>

            <Route
              path="/albums/:albumId"
              render={ () => <div><NavLink to='/'>Back to Albums list</NavLink></div> }
            />
            <Route
              path="/albums/:albumId"
              render={ props => <AlbumDetailsLoader id={props.match.params.albumId}/> }
            />
          </Grid.Column>
        </Grid>
      </Router>
    );
  }
}

export default withAuthenticator(App, {includeGreetings: true});
{{< /highlight >}}

### What we changed in src/App.js

- Imported the *Connect* component from aws-amplify-react

- Imported more presentational components from *semantic-ui-react*

- Imported *API* and *graphqlOperation* from *aws-amplify*

- Imported routing components from *react-router-dom*

- Added *makeComparator* to allow us to sanely sort strings in JS

- Added new components: *NewAlbum*, *AlbumsList*, *AlbumsDetailsLoader*, *AlbumDetails*, *AlbumsListLoader*

- Added GraphQL queries and mutations: *ListAlbums*, *SubscribeToNewAlbums*, *GetAlbum*

- Updated the App component to present different components based on the current URL route

### Try out the app

Check out the app now and try out the new features: 

- View the list of albums

- Create a new album and see it appear in the albums list

- Click into an album to see the beginnings of our Album details view

- When viewing an Album, click 'Back to Albums list' to go home

{{% notice tip %}}
The loading magic here comes from [AWS Amplify's *Connect* component](https://aws-amplify.github.io/docs/js/api#connect) (which we imported from the *aws-amplify-react* package). All we need to do is pass this component a GraphQL query operation in its query prop. It takes care of running that query when the component mounts, and it passes information down to a child function via the data, loading, and errors arguments. We use those values to render appropriately, either showing some loading text or passing the successfully fetched data to our *AlbumsList* component.
{{% /notice %}}

{{% notice info %}}
The *listAlbums* query we're above using passes in a very high limit argument. This is because we can just load all of the albums in one request and sort the albums alphabetically on the client-side (instead of dealing with paginated DynamoDB responses). This keeps the *AlbumsList* code pretty simple, so it's probably worth the trade off in terms of performance or network cost.
{{% /notice %}}

{{% notice info %}}
Also worth noting is how we're leveraging an AppSync real-time subscription to automatically refresh the list of albums whenever a new album is created.
<br/>
<br/>
Our GraphQL schema contains a *Subscription* type with a bunch of subscriptions that were auto-generated back when we had AWS AppSync create the resources (like the DynamoDB table and the AWS AppSync resolvers) for our *Album* type. One of these the _onCreateAlbum_ subscription.
<br/>
<br/>
The _subscription_ and _onSubscriptionMsg_ properties on the _Connect_ component tell it to subscribe to the _onCreateAlbum_ event data and update the data for AlbumsList accordingly. 
<br/>
<br/>
The content for the subscription property looks very similar to what we provided for the query property previously; it just contains a query specifying the subscription we want to listen to and what fields we'd like back when new data arrives. The only slightly tricky bit is that we also need to define a handler function to react to new data from the subscription, and that function needs to return a new set of data that the _Connect_ component will use to refresh our _ListAlbums_ component. This is what we've done above.
{{% /notice %}}
