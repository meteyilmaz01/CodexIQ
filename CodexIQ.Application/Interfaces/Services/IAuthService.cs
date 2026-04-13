using CodexIQ.Application.DTOs.AuthDTOs;
using System;
using System.Collections.Generic;
using System.Text;

namespace CodexIQ.Application.Interfaces.Services
{
    public interface IAuthService
    {
        Task<AuthResponseDto> LoginAsync(LoginRequestDto request);
        Task ChangePasswordAsync(Guid userId, ChangePasswordRequestDto request);
    }
}
