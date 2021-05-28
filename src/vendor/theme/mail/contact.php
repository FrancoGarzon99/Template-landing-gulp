<?php
// Check for empty fields
if(empty($_POST['name']) || empty($_POST['email']) || empty($_POST['phone']) || empty($_POST['message']) || !filter_var($_POST['email'], FILTER_VALIDATE_EMAIL))
{
	echo json_encode(array("success" => false, "message" => "Todos los campos son requeridos!"));
	return;
}

if(empty($_POST['g-recaptcha-response']))
{
	echo json_encode(array("success" => false, "message" => "Problemas con ReCaptcha!"));
	return;
}

if(isset($_POST['g-recaptcha-response']))
{
	//your site secret key
	$secret = 'RECAPTCHA_SECRET_KEY';

	//get verify response data
	$verifyResponse = file_get_contents('https://www.google.com/recaptcha/api/siteverify?secret='.$secret.'&response='.$_POST['g-recaptcha-response']);
	$responseData = json_decode($verifyResponse);
	
	if(!$responseData->success)
	{
		echo json_encode(array("success" => false, "message" => "Problemas con ReCaptcha o sos un Bot!"));
		return;
	}
}
	
$name 			= $_POST['name'];
$email 			= $_POST['email'];
$phone 			= $_POST['phone'];
$message 		= $_POST['message'];

require '../../phpmailer/PHPMailerAutoload.php';

$mail = new PHPMailer;
$mail->CharSet = 'UTF-8';

//$mail->SMTPDebug = 3;                               // Enable verbose debug output

//$mail->isSMTP();                                      // Set mailer to use SMTP
//$mail->Host = 'smtp1.example.com;smtp2.example.com';  // Specify main and backup SMTP servers
//$mail->SMTPAuth = true;                               // Enable SMTP authentication
//$mail->Username = 'user@example.com';                 // SMTP username
//$mail->Password = 'secret';                           // SMTP password
//$mail->SMTPSecure = 'tls';                            // Enable TLS encryption, `ssl` also accepted
//$mail->Port = 587;                                    // TCP port to connect to

$mail->From = 'desarrollosiniestro@gmail.com';
$mail->FromName = 'Desarrollo Siniestro';
$mail->addAddress('desarrollosiniestro@gmail.com', 'Desarrollo Siniestro');     // Add a recipient
$mail->addReplyTo($email, $name);
//$mail->addCC('cc@example.com');
$mail->addBCC('campanas@siniestro.net');

//$mail->addAttachment('/tmp/image.jpg', 'new.jpg');    // Optional name
$mail->isHTML(true);                                  // Set email format to HTML

$mail->Subject = 'www.sitio.com.uy | Landing';

// render the mail template
//extract(array('name' => $name, 'email' => $email, 'phone' => $phone, 'message' => $message));
ob_start();
include('tmpl/mail.contact.php');
$body = ob_get_contents();
ob_end_clean();

$mail->Body    = $body;
//$mail->AltBody = 'This is the body in plain text for non-HTML mail clients';

if(!$mail->send()) 
{
	echo json_encode(array("success" => false, "message" => 'El mensaje no pudo ser enviado.\nMailer Error: ' . $mail->ErrorInfo));
	return;
} else {
	echo json_encode(array("success" => true, "message" => 'El mensaje ha sido enviado'));
	return;
}