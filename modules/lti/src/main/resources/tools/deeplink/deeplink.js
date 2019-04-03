/**
 * Licensed to The Apereo Foundation under one or more contributor license
 * agreements. See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 *
 * The Apereo Foundation licenses this file to you under the Educational
 * Community License, Version 2.0 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of the License
 * at:
 *
 *   http://opensource.org/licenses/ecl2.txt
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
 * License for the specific language governing permissions and limitations under
 * the License.
 *
 */

/* global $, axios, i18ndata, Mustache */
/* exported populateData, refreshList */

'use strict';

var currentpage,
    context_label,
    defaultLang = i18ndata['en-US'],
    lang = defaultLang;

function matchLanguage(lang) {
  // break for too short codes
  if (lang.length < 2) {
    return defaultLang;
  }
  // Check for exact match
  if (lang in i18ndata) {
    return i18ndata[lang];
  }
  // Check if there is a more specific language (e.g. 'en-US' if 'en' is requested)
  for (const key of Object.keys(i18ndata)) {
    if (key.startsWith(lang)) {
      return i18ndata[key];
    }
  }
  // check if there is a less specific language
  return matchLanguage(lang.substring(0, lang.length - 1));
}

function tryLocalDate(date) {
  try {
    return new Date(date).toLocaleString();
  } catch(err) {
    return date;
  }
}

function i18n(key) {
  return lang[key];
}

function loadLTIData() {
  return axios.get('/lti');
}

// function loadDefaultPlayer() {
//   return axios.get('/info/me.json');
// }

function loadSearchInput() {
  // render series filter
  var seriesFilterTemplate = $('#template-series-filter').html(),
      seriesFilterTplData = {
        lticontextlabel: context_label,
      };
  $('#searchfield').html(Mustache.render(seriesFilterTemplate, seriesFilterTplData));
}

function loadEpisodesTab(page, q) {

  let limit = 15,
      offset = (page - 1) * limit,
      url = '/search/episode.json?limit=' + limit + '&offset=' + offset + '&q=' + q;

  currentpage = page;

  // load spinner
  $('#selections').html($('#template-loading').html());

  loadSearchInput();

  axios.get(url)
    .then((response) => {
      let data = response.data['search-results'];
      let rendered = '',
          results = [],
          total = parseInt(data.total);

      if (total > 0) {
        results = Array.isArray(data.result) ? data.result : [data.result];
      }

      for (var i = 0; i < results.length; i++) {
        var episode = results[i],
            i18ncreator = Mustache.render(i18n('CREATOR'), {creator: episode.dcCreator}),
            template = $('#template-episode').html(),
            tpldata = {
              tool: '/play/' + episode.id,
              title: episode.dcTitle,
              i18ncreator: i18ncreator,
              created: tryLocalDate(episode.dcCreated),
              seriestitle: episode.seriestitle,
              mpID: episode.id};

        // get preview image
        var attachments = episode.mediapackage.attachments.attachment;
        attachments = Array.isArray(attachments) ? attachments : [attachments];
        for (var j = 0; j < attachments.length; j++) {
          if (attachments[j].type.endsWith('/search+preview')) {
            tpldata['image'] = attachments[j].url;
            break;
          }
        }

        // render template
        rendered += Mustache.render(template, tpldata);
      }

      // render episode view
      $('#selections').html(rendered);

      // render result information
      // var resultTemplate = i18n('RESULTS'),
      //     resultTplData = {
      //       total: total,
      //       range: {
      //         begin: Math.min(offset + 1, total),
      //         end: offset + parseInt(data.limit)
      //       }
      //     };
      //$('#results').text(Mustache.render(resultTemplate, resultTplData));

      // render pagination
      $('#episodes-pager').pagination({
        dataSource: Array(total),
        pageSize: limit,
        pageNumber: currentpage,
        showNavigator: true,
        formatNavigator: '<%= currentPage %> / <%= totalPage %>, <%= totalNumber %> entries',
        callback: function(data, pagination) {
          if (pagination.pageNumber != currentpage) {
            loadEpisodesTab(pagination.pageNumber);
          }
        }
      });
    });
}

function loadSeriesTab(page, q) {
  let limit = 15,
      offset = (page - 1) * limit,
      url = '/search/series.json?limit=' + limit + '&offset=' + offset + '&q=' + q;

  currentpage = page;

  axios.get(url)
  .then((response) => {
    let data = response.data['search-results'],
        seriestool = 'ltitools/series/index.html?series=',
        rendered = '',
        results = [],
        total = parseInt(data.total);

    if (total > 0) {
      results = Array.isArray(data.result) ? data.result : [data.result];
    }

    for (var i = 0; i < results.length; i++) {
      let serie = results[i],
          template = $('#template-series').html(),
          tpldata = {
            tool: seriestool + serie.id,
            title: serie.dcTitle,
            created: serie.dcCreated,
            image: 'engage/ui/img/logo/opencast-icon.svg'};

      // render template
      rendered += Mustache.render(template, tpldata);
    }

    // render episode view
    $('#series-results').html(rendered);

    // // render result information
    // let resultTemplate = i18n('RESULTS'),
    //     resultTplData = {
    //       total: total,
    //       range: {
    //         begin: Math.min(offset + 1, total),
    //         end: offset + parseInt(data.limit)
    //       }
    //     };
    // $('#results').text(Mustache.render(resultTemplate, resultTplData));

    // render pagination
    $('#series-pager').pagination({
      dataSource: Array(total),
      pageSize: limit,
      pageNumber: currentpage,
      callback: function(data, pagination) {
        if (pagination.pageNumber != currentpage) {
          loadSeriesTab(pagination.pageNumber);
        }
      }
    });
  });
}

function populateData(title, image, created, tool) {
  // pass required data back to the server
  const urlParams = new URLSearchParams(window.location.search);
  $('#content_item_return_url').val(urlParams.get('content_item_return_url'));
  $('#consumer_key').val(urlParams.get('consumer_key'));
  if (urlParams.has('data')) {
    $('#data').val(urlParams.get('data'));
  }
  if (urlParams.has('test')) {
    $('#test').val(urlParams.get('test'));
  }

  // generate content_items
  var contentItems = {
    '@context': 'http://purl.imsglobal.org/ctx/lti/v1/ContentItem',
    '@graph': [{
      '@type': 'LtiLinkItem',
      mediaType: 'application/vnd.ims.lti.v1.ltilink',
      title: title,
      text: created,
      thumbnail: {'@id': image},
      custom: {
        tool: tool
      }
    }]
  };

  $('#content_items').val(JSON.stringify(contentItems).replace(/"/g, '"'));
  document.forms[0].submit();
}

function refreshList() {
  var value = $('#selected-series').val();
  loadEpisodesTab(1, value);
}

lang = matchLanguage(navigator.language);
axios.all([loadLTIData()])
  .then(axios.spread( function (ltidata) {
    context_label = ltidata.data.context_label;
    loadEpisodesTab(1, context_label);
    loadSeriesTab(1, context_label);
  })
  );
