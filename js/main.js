$(document).ready(function () {
	// Initialize AOS (Animate On Scroll) if the library is loaded
	if (typeof AOS !== 'undefined') {
		AOS.init({
			once: true,
			offset: 50,
			duration: 800
		});
	}

	// Scroll listener for Navbar
	$(window).on('scroll', function () {
		if ($(window).scrollTop() >= 50) {
			$(".navbar").addClass("navbar-fixed-top scrolled");
		} else {
			$(".navbar").removeClass("navbar-fixed-top scrolled");
		}
	});
});