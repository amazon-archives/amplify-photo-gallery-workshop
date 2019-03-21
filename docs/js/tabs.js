$(document).ready(function () {

    // build the navigation bar for tabs, based on DIV present in the DOM
    const navTabs = $('#tabs #nav-tabs'); 
    $('#tabs #content-tab').each(function(idx, item) {
        const title = $(this).attr('title');
        const link = $(this).attr('link');
        item.id = link;
        // class .btn prevent Learn them to add its 'highlight' class
        navTabs.append('<li><a class="btn" href="#' + link + '">' + title + '</a></li>');
    });

    $( "#tabs" ).tabs();

    $('li > a', '#content-tab').each(function(idx, item) {
        console.log(item);
    });
 
});
