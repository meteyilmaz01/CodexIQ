using CodexIQ.Application.DTOs.AuthDTOs;
using CodexIQ.Application.Exceptions;
using CodexIQ.Application.Interfaces.CoreDataInterfaces;
using CodexIQ.Application.Interfaces.ExternalServices;
using CodexIQ.Application.Interfaces.Services;

namespace CodexIQ.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUnitOfWork _unitOfWork; 
        private readonly IPasswordHasher _passwordHasher;
        private readonly IJwtProvider _jwtProvider;

        public AuthService(IUnitOfWork unitOfWork, IPasswordHasher passwordHasher, IJwtProvider jwtProvider)
        {
            _unitOfWork = unitOfWork;
            _passwordHasher = passwordHasher;
            _jwtProvider = jwtProvider;
        }

        public async Task ChangePasswordAsync(Guid userId, ChangePasswordRequestDto request)
        {
            var user = await _unitOfWork.User.GetByIdAsync(userId);
            if (user == null) throw new NotFoundException("Kullanıcı bulunamadı");

            var isValid = _passwordHasher.VerifyPassword(request.CurrentPassword, user.PasswordHash);
            if (!isValid) throw new UnauthorizedException("Mevcut şifre hatalı");

            user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
            _unitOfWork.User.Update(user);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request)
        {
            var user = await _unitOfWork.User.GetByEmailAsync(request.Email);

            if (user == null)
                throw new UnauthorizedException("User not found or email address is incorrect.");

            bool isPasswordValid = _passwordHasher.VerifyPassword(request.Password, user.PasswordHash);
            if (!isPasswordValid)
                throw new UnauthorizedException("You entered the wrong password.");

            if (user.IsActive == false)
                throw new UnauthorizedException("Users with inactive status cannot log in.");

            string token = _jwtProvider.GenerateToken(user);

            return new AuthResponseDto
            {
                Token = token,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Role = user.Role.ToString()
            };
        }
    }
}