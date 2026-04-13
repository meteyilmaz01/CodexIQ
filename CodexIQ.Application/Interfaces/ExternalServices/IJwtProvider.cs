using CodexIQ.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace CodexIQ.Application.Interfaces.ExternalServices
{
    public interface IJwtProvider
    {
        string GenerateToken(User user);
    }
}
