<?php
session_start();
if(isset($_SESSION["email"])){
session_destroy();
}
include_once 'dbConnection.php';
$ref=@$_GET['q'];
$email = $_POST['email'];
$password = $_POST['password'];

$password=md5($password); 
$result = db_query($con,"SELECT name FROM user WHERE email = '$email' and password = '$password'") or die('Error');
$count=db_num_rows($result);
if($count==1){
while($row = db_fetch_array($result)) {
	$name = $row['name'];
}
$_SESSION["name"] = $name;
$_SESSION["email"] = $email;
header("location:account.php?q=1");
}
else
header("location:$ref?w=Wrong Username or Password");


?>