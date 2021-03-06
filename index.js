var app = angular.module('App', ['ngRoute']);

app.config(function($routeProvider) {
  $routeProvider
    .when('/home', {
      templateUrl: 'partials/home.html',
      controller: 'BooksController'
    })
    .when('/botd', {
      templateUrl: 'partials/botd.html',
      controller: 'BooksController'
    })
    .otherwise({
      redirectTo: '/home'
    });
});

app.service('DBRunner', function($http) {
  // All DB queries are handled by the DBRunner service

  this.fetch = function(title) {
    return $http({
      method: 'GET',
      url: '/api/books',
    })
  }

  this.sendBook = function(book) {
    return $http({
      method: 'POST',
      url: '/api/books',
      data: JSON.stringify(book)
    })
  }

  this.deleteBook = function(title) {
    var obj = {title: title};

    return $http({
      method: 'POST',
      url: '/api/books/delete',
      data: JSON.stringify(obj)
    })
  }

});

app.service('APICaller', function($http) {
  this.fetch = function(title) {
    return $http({
      method: 'GET',
      url: 'https://www.googleapis.com/books/v1/volumes?q=' + title + '&key=' + API_KEY
    })
  }
});

app.service('Library', function() {
  this.books = [];
});

app.controller('BooksController', function($scope, $http, DBRunner, APICaller) {

  $scope.library = [];
  // When controller is initialized, populate library with data from the DB
  DBRunner.fetch().then(function (response) {
    var booksArr = response.data;

    booksArr.forEach(function(book) {
      $scope.createBook(book.title, book.author, false, book.pages, book.quotes);
    })
  }, function(err) { console.log(err) });

  $scope.isBookInDB = function(newBook) {
    // Check if newBook.title matches any current book records
    DBRunner.fetch().then(function (response) {
      var booksArr = response.data;
      var bookNotInDb = true;

      booksArr.forEach(function(book) {
        if (book.title === newBook.title) {
          bookNotInDb = false
        } 
      });
      // if it doesn't, create a new DB entry and update the DOM
      if (bookNotInDb) {
        $scope.library.push(newBook);
        DBRunner.sendBook(newBook).then(function(response) { console.log(response + 'sent!') }, function(err) { console.log(err) });
      } 

    }, function (err) { console.log(err) });
  }

  $scope.createBook = function(title, author, bool, pages, quotes) {
    bool = bool || false;
    if (title && author) {
      var newBook = {
        title: title, 
        author: author, 
        pages: pages || 0, 
        quotes: quotes || [], 
        editorEnabled: false,
        showQuotes: false,
        getBookInfo: function() {
          APICaller.fetch(this.title).then(function (response) {
            var info = response.data.items[0].volumeInfo;
            console.log(response);
            this.description = info.description;
            this.image = info.imageLinks.smallThumbnail;
            this.fetched = true;
            
          }.bind(this), function(err) { console.log(err) });
        },
        toggleQuotes: function() {
          this.showQuotes = !this.showQuotes;
        },
        toggleEditor: function() {
          this.editorEnabled = !this.editorEnabled;
        },
        addQuote: function(newQuote) {
          this.quotes.push(newQuote);
          this.newQuote = null;
        }
      }

      // Set these values to null in the DOM to clear input fields after user submits a new Book
      $scope.title = null;
      $scope.author = null;

      // if createBook() is invoked from the DOM, this boolean is true and the DB is checked for dupes
      if (bool === true) {
        $scope.isBookInDB(newBook);   
      } else {
        // if createBook() is invoked on init, this boolean is false since the app is using DB values to populate the DOM
        // and another check is redundant. So we just populate on the DOM without checking the DB.
        $scope.library.push(newBook);
      }
    } // if title && author
  }

  $scope.deleteBook = function(index, title) {
    DBRunner.deleteBook(title);
    console.log(index, title);
    $scope.library.splice(index, 1);
  }

});

app.controller('APIController', function($scope, APICaller) {

});