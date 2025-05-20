from .models import SensitiveWord, UserViolationRecord
from users.models import User

class SensitiveFilter:
    """敏感词过滤器"""
    
    @staticmethod
    def filter_sensitive_words(content, user, violation_type="post"):
        """
        过滤内容中的敏感词
        
        Args:
            content: 需要过滤的内容
            user: 用户对象
            violation_type: 违规类型，可选值为'post'或'comment'
            
        Returns:
            tuple: (filtered_content, sensitive_word_found, violation_records)
                filtered_content: 过滤后的内容
                sensitive_word_found: 是否找到敏感词
                violation_records: 创建的违规记录列表
        """
        sensitive_words = SensitiveWord.objects.all()
        filtered_content = content
        sensitive_word_found = False
        violation_records = []
        
        for word in sensitive_words:
            # 如果内容中包含敏感词
            if word.word in content:
                # 替换敏感词为星号
                filtered_content = filtered_content.replace(word.word, '*' * len(word.word))
                sensitive_word_found = True
                
                # 记录违规
                record = UserViolationRecord.objects.create(
                    user=user,
                    sensitive_word=word,
                    original_content=content,
                    filtered_content=filtered_content,
                    violation_type=violation_type
                )
                violation_records.append(record)
        
        # 检查用户违规次数并处理封禁
        if sensitive_word_found:
            SensitiveFilter.check_and_ban_user(user)
            
        return filtered_content, sensitive_word_found, violation_records
    
    @staticmethod
    def check_and_ban_user(user):
        """
        检查用户违规次数，达到阈值时自动封禁
        
        Args:
            user: 用户对象
        """
        violation_count = UserViolationRecord.objects.filter(user=user).count()
        
        # 如果违规次数达到20次且用户尚未被封禁
        if violation_count >= 20 and not user.is_banned:
            user.is_banned = True
            user.save()
            
            return True
        
        return False
    
    @staticmethod
    def check_if_banned(user):
        """
        检查用户是否被封禁
        
        Args:
            user: 用户对象
            
        Returns:
            bool: 用户是否被封禁
        """
        # 确保user对象存在
        if isinstance(user, User):
            return user.is_banned
        return False 