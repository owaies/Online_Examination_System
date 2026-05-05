FROM php:8.2-apache

# Install PostgreSQL client & dev libraries
RUN apt-get update && apt-get install -y \
    libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql pgsql mysqli

# Enable Apache rewrite module
RUN a2enmod rewrite

# Copy application files to web root
COPY . /var/www/html/

# Expose port 80 (used by Cloud Run)
EXPOSE 80

CMD ["apache2-foreground"]
