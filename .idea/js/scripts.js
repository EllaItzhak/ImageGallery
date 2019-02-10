let lastSearchResultArr;


$(document).ready(function () {

    const MAX_NUM_OF_LAST_SEARCHES = 10;
    const SEARCH_ARR = "SEARCH_ARR";
    const SEARCH_COUNTER = "SEARCH_COUNTER";
    let tags="";
    let tempTags;
    let lastSearchesArr;
    let searchesCounter;
    let chosenTagsFromLastSearches = [];

    loadLastSearchesArr();

    //handles the text in the text box and show the last searches relevant to the input, the input text is passed to the flickr api call
    $('#textBox').on('input focus',function(){
        tempTags = $(this).val();
        tags = tempTags.trim();

        $('#result').html('');
        $('#result').show();
        let expression = new RegExp(tags, "i");
        $.each(lastSearchesArr, function (index, searchItem) {
            if((searchItem.toString()).search(expression) != -1){
                $('#result').append('<li class="list-group-item"  value="'+searchItem+'">'+searchItem+'</li>')
            }
        });
        getImagesFromFlickr(tags);
    });

    //When the user selects one or more words, the words are saved in the array (if they dont exist in it)and appear in the text box
    $( "#result" ).on( "click", "li", function( event ) {
        event.preventDefault();
        let word = ( $( this ).text() );
        if(chosenTagsFromLastSearches.includes(word) == false) {
            chosenTagsFromLastSearches.push(word);
        }
        let str = chosenTagsFromLastSearches.toString();
        $('#textBox').val(str);
        getImagesFromFlickr(str);
    });

    //when the mouse leaves the last searches history list the last choices are deleted and the list is hidden
    $('#result').mouseleave(function () {
        chosenTagsFromLastSearches = [];
        $(this).hide();
    });

   //when all and any buttons are changed the call for flickr api is updated
    $('input[type=radio]').change(function () {
        tempTags = $('#textBox').val();
        tags = tempTags.trim();

        getImagesFromFlickr(tags);
    });


    //when the focus is not on the search text box the text is saved in last searches arr
    $('#textBox').focusout(function(){
        tempTags = $(this).val();
        tags = tempTags.trim();
        if(lastSearchesArr.includes(tags) == true || tags == ""){
            return;
        }
        if(searchesCounter >= MAX_NUM_OF_LAST_SEARCHES){
            searchesCounter = searchesCounter % MAX_NUM_OF_LAST_SEARCHES;
        }
        lastSearchesArr[searchesCounter] = tags;
        searchesCounter++;
    });

    //when the save results button is clicked the results of the last search are saved in the local storage
    $('#btnSaveResults').click(function (){
        saveSearchResults(tags, lastSearchResultArr)
    });


    //saves last searches history and counter to local storage on window refresh or closed
    $(window).bind('beforeunload', function(){
        localStorage.setItem(SEARCH_ARR, JSON.stringify(lastSearchesArr));
        localStorage.setItem(SEARCH_COUNTER, JSON.stringify(searchesCounter));
    });

    // loads lastSearchesArr and searchesCounter from local storage
    // if not exist initiates them
    function loadLastSearchesArr() {
        let lastSearchesArrTemp = localStorage.getItem(SEARCH_ARR);
        if(lastSearchesArrTemp == null){
            lastSearchesArr = [];
            searchesCounter = 0;
        }
        else {
            lastSearchesArr = JSON.parse(lastSearchesArrTemp);
            searchesCounter = JSON.parse(localStorage.getItem(SEARCH_COUNTER));
        }
    }
});

//get the image from flickr api according to the tags (input words in search text box) and to any/all tag mode(radio buttons)
//if the tags exist in the local storage it get the images url without making the call to flickr api
function getImagesFromFlickr(tags) {
    if(tags != "") {
        let imagesArrJson = localStorage.getItem(tags);
        if(imagesArrJson == null){
            let tagMode = $("input[name=tagMode]:checked").val();

            let flickrApiUrl = "https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=cb335fe21dc164e60da4c6231ca62fbc&" +
                "tags=" + tags + "&tag_mode=" + tagMode + "&sort=relevance&format=json&nojsoncallback=1";

            $("#flickr").empty();

            $.getJSON(flickrApiUrl, {
            }).done(function (data) {//success
                pullingImagesFromData(data);
                $('#btnSaveResults').removeAttr('disabled');

            }).fail(function () {//failure
                alert("Call Failed");
            });
        }
        else{
            let imageArr = JSON.parse(imagesArrJson);
            addingImagesUrl(imageArr);
        }

    }
}


//get the url of each image from the returned data of the flickr api call
function pullingImagesFromData(data) {
    lastSearchResultArr = [];
    $.each(data.photos.photo, function (index, photo) {
        let url = "http://farm" + photo.farm + ".staticflickr.com/" + photo.server + "/"
            + photo.id + "_" + photo.secret + ".jpg";

        lastSearchResultArr.push(url);
        $('<img>').attr("src", url).appendTo('#flickr');

    });
}

//when the search result array exist in the local storage it show the tag's images from there
function addingImagesUrl(lastSearchResultArr){
    $("#flickr").empty();
    $.each(lastSearchResultArr, function (index, url) {
        $('<img>').attr("src", url).appendTo('#flickr');
    });
}

//saves the last search results and it's tags
function saveSearchResults(tags, lastSearchResultArr) {
    if(localStorage.getItem(tags) == null || tags != "") {
        localStorage.setItem(tags, JSON.stringify(lastSearchResultArr));
    }
}
