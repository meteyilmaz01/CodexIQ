using BCrypt.Net;
using CodexIQ.Application.Interfaces.ExternalServices;
using System;
using System.Collections.Generic;
using System.Text;

namespace CodexIQ.Infrastructure.Authentication
{
    public class PasswordHasher : IPasswordHasher
    {
        public bool VerifyPassword(string password, string hash)
        {
            return BCrypt.Net.BCrypt.Verify(password, hash);
        }

        public string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }
    }
}
