$(document).ready(function () {
  // Load GTag
  $("#gtag").load("/components/core/gtag.html", function (response, status, xhr) {
    if (status === "error") {
      console.error("Error loading dependencies: " + xhr.status + " " + xhr.statusText);
    }
  });

  // Load dependencies
  $("#dependencies").load("/components/core/dependencies.html", function (response, status, xhr) {
    if (status === "error") {
      console.error("Error loading dependencies: " + xhr.status + " " + xhr.statusText);
    }
  });

  // Load navigation
  $("#navigation").load("/components/core/navigation.html", function (response, status, xhr) {
    if (status === "error") {
      console.error("Error loading navigation: " + xhr.status + " " + xhr.statusText);
    }
  });

  // Load footer
  $("#footer").load("/components/core/footer.html", function (response, status, xhr) {
    if (status === "error") {
      console.error("Error loading footer: " + xhr.status + " " + xhr.statusText);
    }
  });

  // Contents button
  var contentsBtn = $('#contents-button');

  // Show or hide the button based on scroll position
  $(window).scroll(function () {
    if ($(window).scrollTop() > 300) {
      contentsBtn.addClass('show');
    } else {
      contentsBtn.removeClass('show');
    }
  });

  // Scroll to #contents section when the button is clicked
  contentsBtn.on('click', function (e) {
    e.preventDefault();
    var target = $('#contents'); // Select the #contents element
    if (target.length) { // Check if #contents exists
      $('html, body').animate(
        { scrollTop: target.offset().top }, // Scroll to #contents
        300 // Animation duration in milliseconds
      );
    } else {
      console.error('Error: #contents element not found.');
    }
  });


});
