
<?php
include_once 'dbConnection.php';
$ref=@$_GET['q'];
//$name = $_POST['name'];
//$name= ucwords(strtolower($name));
//$gender = $_POST['gender'];
$email = $_POST['email'];

$password = $_POST['password'];



$q=$con->query("INSERT INTO admin VALUES ('$email', '$password', 'admin')");


header("location:$ref?q=Succesfully registered");


?>