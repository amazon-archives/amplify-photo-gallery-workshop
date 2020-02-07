/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const listAlbums = /* GraphQL */ `
  query ListAlbums(
    $filter: ModelAlbumFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listAlbums(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        name
        owner
        photos {
          nextToken
        }
      }
      nextToken
    }
  }
`;
export const getAlbum = /* GraphQL */ `
  query GetAlbum($id: ID!) {
    getAlbum(id: $id) {
      id
      name
      owner
      photos {
        items {
          id
          albumId
          bucket
          owner
        }
        nextToken
      }
    }
  }
`;
export const getPhoto = /* GraphQL */ `
  query GetPhoto($id: ID!) {
    getPhoto(id: $id) {
      id
      albumId
      bucket
      fullsize {
        key
        width
        height
      }
      thumbnail {
        key
        width
        height
      }
      album {
        id
        name
        owner
        photos {
          nextToken
        }
      }
      owner
    }
  }
`;
export const listPhotos = /* GraphQL */ `
  query ListPhotos(
    $filter: ModelPhotoFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listPhotos(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        albumId
        bucket
        fullsize {
          key
          width
          height
        }
        thumbnail {
          key
          width
          height
        }
        album {
          id
          name
          owner
        }
        owner
      }
      nextToken
    }
  }
`;
export const listPhotosByAlbum = /* GraphQL */ `
  query ListPhotosByAlbum(
    $albumId: ID
    $sortDirection: ModelSortDirection
    $filter: ModelPhotoFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listPhotosByAlbum(
      albumId: $albumId
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        albumId
        bucket
        fullsize {
          key
          width
          height
        }
        thumbnail {
          key
          width
          height
        }
        album {
          id
          name
          owner
        }
        owner
      }
      nextToken
    }
  }
`;
