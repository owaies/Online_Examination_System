<?php
include_once 'dbConnection.php';
$ref=@$_GET['q'];
$name = $_POST['name'];
$email = $_POST['email'];
$subject = $_POST['subject'];
$id=uniqid();
date_default_timezone_set('Asia/Kolkata');
$date=date("Y-m-d");
$time=date("h:i:sa");
$feedback = $_POST['feedback'];
$q=$con->query("INSERT INTO feedback VALUES  ('$id' , '$name', '$email' , '$subject', '$feedback' , '$date' , '$time')");
header("location:$ref?q=Thank you for your valuable feedback");
?>