var UrlExpander = Class(Events,
{
  // Service to expand urls
  _serviceUrl: "https://api.twitter.com/1/urls/resolve.json?",
  _batchSize: 50,

  expand: function(urls)
  {
    var results = {};
    return Co.Routine(this,
      function()
      {
        this.emit("networkActivity", true);
        var batches = [];
        for (var i = 0, len = urls.length; i < len; i += this._batchSize)
        {
          batches.push(urls.slice(i, i + this._batchSize));
        }
        return Co.Foreach(this, batches,
          function(batch)
          {
            return Ajax.create(
            {
              method: "GET",
              url: this._serviceUrl + batch().map(function(url)
              {
                return "urls%5B%5D=" + escape(url)
              }).join("&"),
              headers: KEYS.twitterResolve,
              proxy: networkProxy
            });
          },
          function(r)
          {
            try
            {
              var json = r().json();
              for (var url in json)
              {
                results[url] = this._expanders(json[url]);
              }
            }
            catch (e)
            {
              Log.exception("UrlExpander failed", e);
            }
            return true;
          }
        );
      },
      function()
      {
        this.emit("networkActivity", false);
        return results;
      }
    );
  },

  _expanders: function(url)
  {
    // Instagram
    if (url.indexOf("http://instagr.am/p/") === 0)
    {
      return {
        url: url + "/media?size=m",
        media_url: url + "/media?size=l",
        type: "photo"
      };
    }
    // YouTube - No YouTube for now because iframes mess up the touch scolling in iOS 5.1 :-(
    /* else if (url.indexOf("http://www.youtube.com/watch?v=") === 0)
    {
      var v = new xo.Url(url).getParameter("v");
      return {
        url: url,
        type: "video",
        html: '<iframe width="350" height="262" src="http://www.youtube.com/embed/' + v + '?rel=0" frameborder="0" allowfullscreen></iframe>',
        html_large: '<iframe width="640" height="360" src="http://www.youtube.com/embed/' + v + '?rel=0" frameborder="0" allowfullscreen></iframe>'
      }
    } */
    // YouTube - picture only
    else if (url.indexOf("http://www.youtube.com/watch?v=") === 0)
    {
      var v = new xo.Url(url).getParameter("v");
      return {
        url: url,
        media_url: "http://img.youtube.com/vi/" + v + "/0.jpg",
        type: "video"
      }
    }
    // Twitpic
    else if (url.indexOf("http://twitpic.com/") === 0)
    {
      return {
        url: url,
        media_url: "http://twitpic.com/show/large/" + new xo.Url(url).pathname,
        type: "photo"
      };
    }
    // YFrog
    else if (url.indexOf("http://yfrog.com/") === 0)
    {
      return {
        url: url + ":iphone",
        media_url: url + ":medium",
        type: "photo"
      };
    }
    else
    {
      return {
        url: url
      };
    }
  }
});
