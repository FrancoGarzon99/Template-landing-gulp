$(function() {
    var contactForm = $(".contact-form").validate({
        errorClass: "uk-form-danger",
        validClass: "uk-form-success",
        errorElement: "p",
        errorPlacement: function(error, element) {
            //error.removeClass('uk-form-danger').addClass('tm-form-error uk-text-left uk-text-danger uk-form-help-block').insertAfter( element );
        },
        success: function(errorElement, element) {
            //errorElement.text("ok!").removeClass('uk-text-danger').addClass("uk-text-success");
        },
        rules: {
            name: "required",
            email: {
                required: true,
                email: true
            },
            phone: {
                required: true,
                number: true
            },
            message: "required",
        },
        messages: {
            name: "Este campo es obligatorio.",
            email: {
                required: "Este campo es obligatorio.",
                email: "Por favor, escribe una dirección de correo válida."
            },
            phone: "Este campo es obligatorio.",
            message: "Este campo es obligatorio.",
        },
        submitHandler: function(form) {
            var url = form.action,
                name = $("input#name", form).val(),
                email = $("input#email", form).val(),
                phone = $("input#phone", form).val(),
                message = $("textarea#message", form).val();
            
            $('.submit-button', form).attr('disabled', 'disabled');
            
            grecaptcha.execute('RECAPTCHA_KEY', {action: 'formularios/contacto'}).then(function(token) {

                $.ajax({
                    url: url,
                    type: "POST",
                    data: {
                        name: name,
                        phone: phone,
                        email: email,
                        message: message
                        ,'g-recaptcha-response': token
                    },
                    cache: false,
                    success: function(resdata) {
                        $('.submit-button', form).removeAttr('disabled');
                        
                        data = JSON.parse(resdata);

                        if(data.success){
                            $("input#name", form).val('');
                            $("input#email", form).val('');
                            $("input#phone", form).val('');
                            $("textarea#message", form).val('');
                            
                            UIkit.notification({
                                message: '<span uk-icon="icon: check"></span> Gracias por comunicarte con nosotros!!',
                                pos: 'top-center'
                            });
        
                            ga('send', {
                                hitType: 'event',
                                eventCategory: 'Formulario',
                                eventAction: 'envio',
                                eventLabel: 'Contacto'
                            });
        
                            contactForm.resetForm();
                        } else {
                            UIkit.notification({
                                message: '<span uk-icon="icon: warning"></span> ' + data.message,
                                status: 'danger',
                                timeout: 5000,
                                pos: 'top-center'
                            });
                        }
                    },
                    error: function() {
                        $('.submit-button', form).removeAttr('disabled');
                        UIkit.notification({
                            message: '<span uk-icon="icon: warning"></span> Problemas con el servidor intentalo más tarde.',
                            status: 'danger',
                            timeout: 5000,
                            pos: 'top-center'
                        });
                    },
                });
            });
        }
    });
});