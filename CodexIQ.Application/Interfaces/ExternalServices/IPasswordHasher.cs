using System;
using System.Collections.Generic;
using System.Text;

namespace CodexIQ.Application.Interfaces.ExternalServices
{
    public interface IPasswordHasher
    {
        bool VerifyPassword(string password, string hash);
        string HashPassword(string password);
    }
}
