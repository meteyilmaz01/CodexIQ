using System;
using System.Collections.Generic;
using System.Text;

namespace CodexIQ.Application.DTOs.AuthDTOs
{
    public class LoginRequestDto
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }
}
