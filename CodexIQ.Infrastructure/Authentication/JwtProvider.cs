using CodexIQ.Application.Interfaces.ExternalServices;
using CodexIQ.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace CodexIQ.Infrastructure.Authentication
{
    public class JwtProvider : IJwtProvider
    {

        private readonly IConfiguration _configuration;

        public JwtProvider(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string GenerateToken(User user)
        {
            var jwtSettings = _configuration.GetSection("Jwt");
            var secretKey = jwtSettings["SecretKey"];

            // 1. Şifreleme algoritması ve anahtarı ayarlanıyor 
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey!));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            // 2. Token'ın içine gömülecek "herkese açık" veriler (Claims)
            // DİKKAT: Buraya asla şifre gibi gizli veriler konmaz!
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role.ToString()),
                new Claim("FirstName", user.FirstName),
                new Claim("LastName", user.LastName)
            };

            // 3. Token'ın kendisi oluşturuluyor
            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(double.Parse(jwtSettings["ExpirationInMinutes"]!)),
                signingCredentials: credentials);

            // 4. Token metin (string) formatına çevrilip geri dönülüyor
            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
