$(document).ready(function() {
	$( "#start" ).datepicker({
		minDate: 0,
		numberOfMonths: 2,
		defaultDate: "+1w",
		onClose: function( selectedDate ) {
			var nyd = new Date( selectedDate );
			nyd.setDate(nyd.getDate() + 45);
			$( "#end" ).datepicker( "option", "minDate", selectedDate );
			$( "#end" ).datepicker( "option", "maxDate", nyd );
		}
	}).datepicker("setDate", "+1w");;
	$( "#end" ).datepicker({
		minDate: 0,
		maxDate: "+7w",
		numberOfMonths: 2,
		defaultDate: "+1w",
		onClose: function( selectedDate ) {
			//$( "#start" ).datepicker( "option", "maxDate", selectedDate );
		}
	}).datepicker("setDate", "+1w");;
	$( "#from" ).select2({
		placeholder: "Select origin airport",
		data: destinations,
	});
	$( "#to" ).select2({
		placeholder: "Select destination airport",
		data: destinations,
	});
	$("#fromlabel").popover({
		placement: 'top',
		trigger: 'manual',
		title: 'Origin Required',
		content: 'You must enter an origin airport.',
	});
	$("#tolabel").popover({
		placement: 'top',
		trigger: 'manual',
		title: 'Destination Required',
		content: 'You must enter a destination airport.',
	});
	$("#from").click(function () {
		$("#fromlabel").popover('hide');
	});
	$("#to").click(function () {
		$("#tolabel").popover('hide');
	});
	$("#tolabel").popover({
		placement: 'top',
		trigger: 'manual',
		title: 'Maximum 45 Days',
		content: 'The end date must be less than 45 days from the start date.'
	});
	$("#emaillabel").popover({
		placement: 'bottom',
		trigger: 'manual',
		title: 'Valid Email Required',
		content: 'Please enter a valid email address.',
	});
	$('#recaptcha').on('shown', function () {
		// focus the recaptcha field to ease workflow
		Recaptcha.focus_response_field();
	})
	// allow enter to be used to submit the recaptcha form
	$("#recaptcha_response_field").keypress(function(event) {
		if (event.keyCode == 13) {
			submitForm();
		}
	});
});

$("#recaptchasubmit").click(function() {
	submitForm();
	return false;
});

function jsonFlickrApi(rsp) {
	if (rsp.stat != "ok"){
		return;
	}
	var s = "";
	var id = "";
	var count = 0;
	while (s == "" && count < 100) {
		var i = Math.random();
		i = i * 100;
		i = Math.ceil(i);
		if (typeof rsp.photos.photo[i].url_l != 'undefined') {
			s = rsp.photos.photo[i].url_l;
			id = rsp.photos.photo[i].id;
		}
		count++;
	}
	$('.main').css('background-image', 'url(' + s + ')');
	$.ajax({
		url: 'http://api.flickr.com/services/rest/?method=flickr.photos.getInfo&format=json&photo_id=' + id + '&api_key=' + flickr_public,
        dataType: 'jsonp',
		jsonp: 'jsoncallback',
        success: function(data) {
			var text = '<a target="_blank" href="http://www.flickr.com/photos/' + data.photo.owner.nsid + '/' + data.photo.id + '">' + data.photo.title._content.split('(',1)[0] + '</a>' + ' by ';
			if (data.photo.owner.realname !== '') {
				text += data.photo.owner.realname;
			} else {
				text += data.photo.owner.username;
			}
			$("#attribution").html(text);
			$("#attribution").show();
		}
	});
}

function parseDate(input) {
	var parts = input.match(/(\d+)/g);
	return new Date(parts[2], parts[0]-1, parts[1]);
}

function checkInputs() {
	var error = false;
	if ($("#from").val() === '') {
		error = true;
		$("#fromlabel").popover('show');
	}
	if ($("#to").val() === '') {
		error = true;
		$("#tolabel").popover('show');
	}
	if ((parseDate($("#end").val()) - parseDate($("#start").val()))/(1000*60*60*24) > 45) {
		error = true;
		$("#endlabel").popover('show');
	}
	if (isEmail($("#email").val()) == false) {
		error = true;
		$("#emaillabel").popover('show');
	}
	if (error == false) {
		if (req_captcha == true) {
			// show captcha popup
			$('#recaptcha').modal('show');
		} else {
			// submit form
			submitForm();
		}
	}
}

function submitForm() {
	$('#recaptcha').modal('hide');
	$('#searchbutton').text('Processing...');
	$('#searchbutton').attr('disabled', 'disabled');
	$.ajax({
		type: "POST",
		url: "/submit",
		data: $("#searchform").serialize(),
		success: function(data)
		{
			if (data.result) {
				// clear dest so you can't immediately resubmit
				$("#to").select2("val", null);
				// captcha has now been validated
				req_captcha = false;
				var noty_id = noty({text: data.message,
									type: 'success',
									timeout: 60000,
								   });				
			} else {
				// Could be an invalid captcha, try again
				Recaptcha.reload();
				var noty_id = noty({text: data.message,
									type: 'error',
								   });
			}
			$('#searchbutton').text('Search');
			$('#searchbutton').removeAttr('disabled');
		}
	});
}

function isEmail(email) {
	var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(email);
}
