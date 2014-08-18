jQuery(document).ready(function() {
	// Initialize to closed
	jQuery('.question').append('<span class="faq-triangle" style="float:left;">&#9654;</span>');
	jQuery('.answer').hide();

	// If a closed question is clicked
	jQuery('.question').live('click', function(event) {
		event.preventDefault();
		var faq_id = '#' + jQuery(this).attr('id');
		jQuery(this).removeClass().addClass('question-open');
		jQuery(faq_id + ' .faq-triangle').html('&#9660;');
		jQuery(faq_id + '-answer').slideDown();
	});
	
	// If an open question is clicked
	jQuery('.question-open').live('click', function(event) {
		event.preventDefault();
		var faq_id = '#' + jQuery(this).attr('id');
		jQuery(this).removeClass().addClass('question');
		jQuery(faq_id + ' .faq-triangle').html('&#9654;');
		jQuery(faq_id + '-answer').slideUp();
	});
});